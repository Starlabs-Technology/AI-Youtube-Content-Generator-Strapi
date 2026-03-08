import { factories } from '@strapi/strapi';
import { inspect } from 'node:util';
import { ApifyClient } from './apify-client';
import { GeminiClient } from './gemini-client';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

export default factories.createCoreService(
  'plugin::ai-youtube-article.ai-job',
  ({ strapi }) => ({

    /** Build an ApifyClient from the stored settings */
    async getApifyClient(): Promise<ApifyClient> {
      const settings = await strapi
        .plugin('ai-youtube-article')
        .service('settings')
        .getSettings();

      return new ApifyClient({
        apiToken: settings.apifyApiToken,
        actorId: settings.apifyActorId,
      });
    },

    /** Build a GeminiClient from the stored settings */
    async getGeminiClient(): Promise<GeminiClient> {
      const settings = await strapi
        .plugin('ai-youtube-article')
        .service('settings')
        .getSettings();

      return new GeminiClient({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel || 'gemini-2.5-flash',
      });
    },

    /**
     * Create a new transcription job and kick off background processing.
     * Returns immediately so the UI stays responsive.
     */
    async createJob(youtubeUrl: string, user: any) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      logger.info('📝 Creating transcription job', { youtubeUrl, userId: user?.id });

      const job = await strapi.entityService.create(
        'plugin::ai-youtube-article.ai-job',
        {
          data: {
            youtubeUrl,
            status: 'pending',
            progress: 0,
            createdBy: user?.id,
          },
        }
      );

      logger.info('✅ Job created in database', { jobId: job.id });

      // Fire-and-forget background processing
      this.processJob(job.id).catch((err: any) => {
        logger.error(`Background job processing failed: ${err?.message}`, { jobId: job.id });
      });

      return job;
    },

    /**
     * Background processing pipeline:
     *   1. Call Apify to get YouTube transcript
     *   2. Send transcript to Gemini to generate article
     *   3. Save results to the job record
     */
    async processJob(jobId: number) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      try {
        // ── Step 1: Mark as processing ──
        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          { data: { status: 'processing', progress: 5 } }
        );

        // ── Step 2: Get transcript from Apify ──
        logger.info('🎬 Fetching transcript from Apify', { jobId });
        const apifyClient = await this.getApifyClient();

        // Start the run and store the run ID
        const runId = await apifyClient.startRun(job.youtubeUrl);
        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          { data: { pythonJobId: runId, progress: 15 } }
        );

        logger.info('🔄 Apify run started, waiting for completion', { jobId, runId });

        // Poll until done
        const runData = await apifyClient.waitForRun(runId);
        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          { data: { progress: 45 } }
        );

        // Get transcript data
        const items = await apifyClient.getTranscript(runData.defaultDatasetId);
        if (!items.length) {
          throw new Error('No transcript data returned — video may not have captions');
        }

        const item = items[0];
        const transcript = Array.isArray(item.captions)
          ? item.captions.join(' ')
          : String(item.captions || '');

        if (!transcript.trim()) {
          throw new Error('Transcript is empty — video may not have captions');
        }

        logger.info('📄 Transcript fetched', {
          jobId,
          videoId: item.videoId,
          transcriptLength: transcript.length,
        });

        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          { data: { progress: 55 } }
        );

        // ── Step 3: Generate article with Gemini ──
        logger.info('🤖 Generating article with Gemini', { jobId });
        const geminiClient = await this.getGeminiClient();

        const generated = await geminiClient.generateArticle(transcript, {
          videoId: item.videoId,
          channelName: item.channelName,
          description: item.description,
          datePublished: item.datePublished,
          keywords: item.keywords,
        });

        logger.info('✨ Article generated', {
          jobId,
          headline: generated.headline,
          articleLength: generated.article?.length,
          tags: generated.tags,
        });

        // ── Step 4: Save completed job ──
        const metadata = {
          videoId: item.videoId,
          channelName: item.channelName,
          channelHandle: item.channelHandle,
          description: item.description,
          viewCount: item.viewCount,
          likes: item.likes,
          datePublished: item.datePublished,
          keywords: item.keywords,
          thumbnail: item.thumbnail,
          transcriptLength: transcript.length,
          apifyRunId: runId,
          generatedTags: generated.tags,
        };

        const updatedJob = await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          {
            data: {
              status: 'completed',
              progress: 100,
              articleTitle: generated.headline,
              articleContent: generated.article,
              articleSummary: generated.summary,
              metadata,
              completedAt: new Date().toISOString(),
            },
          }
        );

        logger.info('🎯 Job completed successfully', { jobId });
        return updatedJob;

      } catch (error: any) {
        const errMsg = error?.message || 'Unknown error during processing';
        logger.error(`❌ Job processing failed: ${errMsg}`, {
          jobId,
          stack: error?.stack,
        });

        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          {
            data: {
              status: 'failed',
              errorMessage: error?.message || 'Unknown error during processing',
            },
          }
        );

        throw error;
      }
    },

    /**
     * Refresh job status – for jobs still processing, check if background
     * processing has updated them. For completed/failed, just return.
     */
    async updateJobStatus(jobId: number) {
      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId,
        { populate: ['createdArticle'] }
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // No external polling needed — background processJob handles everything.
      // Just return the current state.
      return job;
    },

    async find({
      populate = [],
      _limit,
      _start,
      _sort,
      page,
      pageSize,
      'pagination[page]': paginationPage,
      'pagination[pageSize]': paginationPageSize,
      ...rest
    }: any = {}) {
      // Pagination defaults and caps
      const DEFAULT_PAGE_SIZE = 25;
      const MAX_PAGE_SIZE = 100;

      const requestedPage = parseInt(page as any || paginationPage as any || '1', 10) || 1;
      let requestedPageSize = parseInt(pageSize as any || paginationPageSize as any || _limit as any || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;

      // Handle Strapi's -1 no-limit convention by capping to MAX_PAGE_SIZE
      if (String(_limit) === '-1') {
        requestedPageSize = MAX_PAGE_SIZE;
      }

      if (requestedPageSize > MAX_PAGE_SIZE) requestedPageSize = MAX_PAGE_SIZE;

      const start = _start !== undefined ? parseInt(String(_start), 10) || 0 : (requestedPage - 1) * requestedPageSize;
      const limit = requestedPageSize;

      // Build basic filters (extend as needed)
      const filters: any = {};
      if (rest.status) filters.status = rest.status;

      // Sorting
      let sortObj: any = { createdAt: 'desc' };
      const sortParam = String(_sort || rest._sort || 'createdAt:desc');
      if (sortParam) {
        const [field, dir] = sortParam.split(':');
        sortObj = { [field || 'createdAt']: dir || 'desc' };
      }

      const total = await strapi.db.query('plugin::ai-youtube-article.ai-job').count({ where: filters });

      const results = (await strapi.entityService.findMany('plugin::ai-youtube-article.ai-job', {
        filters,
        populate,
        sort: sortObj,
        start,
        limit,
      })) as any[];

      const pageCount = Math.max(1, Math.ceil(total / limit || 1));

      return {
        results,
        pagination: {
          page: requestedPage,
          pageSize: limit,
          pageCount,
          total,
        },
      };
    },

    // Return summary counts for dashboard usage
    async getSummary() {
      const total = await strapi.db.query('plugin::ai-youtube-article.ai-job').count();
      const pending = await strapi.db.query('plugin::ai-youtube-article.ai-job').count({ where: { status: 'pending' } });
      const processing = await strapi.db.query('plugin::ai-youtube-article.ai-job').count({ where: { status: 'processing' } });
      const completed = await strapi.db.query('plugin::ai-youtube-article.ai-job').count({ where: { status: 'completed' } });
      const failed = await strapi.db.query('plugin::ai-youtube-article.ai-job').count({ where: { status: 'failed' } });

      return {
        total,
        inProgress: pending + processing,
        pending,
        processing,
        completed,
        failed,
      };
    },

    async syncActiveJobs({ limit = 50 }: { limit?: number } = {}) {
      // With the Apify+Gemini pipeline, jobs are processed in background by processJob().
      // This method is kept for backward compatibility but no longer polls an external service.
      const jobs = (await strapi.entityService.findMany(
        'plugin::ai-youtube-article.ai-job',
        {
          filters: {
            status: { $in: ['pending', 'processing'] },
          },
          fields: ['id', 'status'],
          sort: { updatedAt: 'asc' },
          limit,
        }
      )) as any[];

      return { checked: jobs?.length || 0, updated: 0, failed: 0 };
    },

    async createArticleFromJob(jobId: number) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId,
        { populate: ['createdArticle'] }
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status !== 'completed') {
        throw new Error('Job must be completed before creating article');
      }

      if (job.createdArticle) {
        throw new Error('Article already created for this job');
      }

      try {
        const paragraphs = job.articleContent
          .split('\n\n')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        const contentBlocks = paragraphs.map((para) => ({
          __component: 'content.paragraph',
          content: para,
        }));

        logger.info('Creating draft article', {
          jobId,
          title: job.articleTitle,
          blockCount: contentBlocks.length,
        });

        const article = await strapi.entityService.create(
          'api::article.article',
          {
            data: {
              title: job.articleTitle,
              slug: slugify(job.articleTitle),
              excerpt: job.articleSummary?.substring(0, 300) || '',
              content: contentBlocks,
              aiTranscription: job.articleContent,
              publishedAt: null,
              featured: false,
              trending: false,
              category: null,
              author: null,
              tags: [],
              coverImage: null,
            },
          }
        );

        logger.info('Draft article created', {
          jobId,
          articleId: article.id,
        });

        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          {
            data: {
              createdArticle: article.id,
            },
          }
        );

        return article;
      } catch (error) {
        logger.error('Failed to create article', {
          jobId,
          error: error.message,
          stack: error.stack,
        });

        throw error;
      }
    },

    async retryJob(jobId: number) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status !== 'failed') {
        throw new Error('Only failed jobs can be retried');
      }

      logger.info('🔄 Retrying failed job', { jobId });

      await strapi.entityService.update(
        'plugin::ai-youtube-article.ai-job',
        jobId,
        {
          data: {
            status: 'pending',
            progress: 0,
            pythonJobId: null,
            errorMessage: null,
            errorDetails: null,
          },
        }
      );

      // Fire-and-forget background processing
      this.processJob(jobId).catch((err: any) => {
        logger.error('Retry background processing failed', { jobId, error: err?.message });
      });

      // Return the updated job
      return await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId
      );
    },

    async deleteJob(jobId: number, deleteArticle: boolean = false) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId,
        { populate: ['createdArticle'] }
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (deleteArticle && job.createdArticle) {
        logger.info('Deleting associated article', {
          jobId,
          articleId: job.createdArticle.id,
        });

        await strapi.entityService.delete(
          'api::article.article',
          job.createdArticle.id
        );
      }

      logger.info('Deleting job', { jobId });
      return await strapi.entityService.delete(
        'plugin::ai-youtube-article.ai-job',
        jobId
      );
    },
  })
);
