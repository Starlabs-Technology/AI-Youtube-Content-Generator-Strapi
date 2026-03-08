import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'plugin::ai-youtube-article.ai-job',
  ({ strapi }) => ({
    async create(ctx) {
      const { youtubeUrl } = ctx.request.body;

      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;

      if (!youtubeUrl || !youtubeRegex.test(youtubeUrl)) {
        return ctx.badRequest('Invalid YouTube URL format');
      }

      try {
        const job = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .createJob(youtubeUrl, ctx.state.user);

        return ctx.created({ data: job });
      } catch (error: any) {
        strapi.log.error('Failed to create job', error);
        return ctx.internalServerError('Failed to create transcription job');
      }
    },

    async findOne(ctx) {
      const { id } = ctx.params;

      try {
        const job = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .updateJobStatus(parseInt(id));

        // Debug: surface job fields so admin route logs what is returned
        strapi.log.debug('[ai-job.findOne] returning job', { id, articleTitle: job?.articleTitle, hasArticle: !!(job?.articleTitle || job?.articleContent || job?.articleSummary), status: job?.status });

        return ctx.send({ data: job });
      } catch (error: any) {
        strapi.log.error('Failed to fetch job', error);

        // If the service threw a not-found error, surface this as a 404 to the admin client
        const msg = String(error?.message || '').toLowerCase();
        if (msg.includes('not found')) {
          return ctx.notFound(error?.message || 'Job not found');
        }

        return ctx.internalServerError('Failed to fetch job status');
      }
    },

    async find(ctx) {
      try {
        const service = strapi.plugin('ai-youtube-article').service('ai-job');

        const { results, pagination } = await service.find({
          ...ctx.query,
          populate: ['createdArticle'],
        });

        return ctx.send({ data: results, meta: { pagination } });
      } catch (error: any) {
        strapi.log.error('Failed to list jobs', error);
        return ctx.internalServerError('Failed to list jobs');
      }
    },

    async createArticle(ctx) {
      const { id } = ctx.params;

      try {
        const article = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .createArticleFromJob(parseInt(id));

        return ctx.created({
          data: {
            articleId: article.id,
            jobId: parseInt(id),
            message: 'Draft article created successfully',
          },
        });
      } catch (error: any) {
        const err = error;

        strapi.log.error('Failed to create article', err);

        if (err?.message?.includes('not completed')) {
          return ctx.badRequest(err.message);
        }
        if (err?.message?.includes('already created')) {
          return ctx.conflict(err.message);
        }

        return ctx.internalServerError('Failed to create article');
      }
    },

    async retry(ctx) {
      const { id } = ctx.params;

      try {
        const job = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .retryJob(parseInt(id));

        return ctx.send({
          data: job,
          message: 'Job retry initiated',
        });
      } catch (error: any) {
        const err = error;

        strapi.log.error('Failed to retry job', err);

        if (err?.message?.includes('not found')) {
          return ctx.notFound(err.message);
        }
        if (err?.message?.includes('Only failed')) {
          return ctx.badRequest(err.message);
        }

        return ctx.internalServerError('Failed to retry job');
      }
    },

    // POST admin action to re-check job status and update fields
    async refresh(ctx) {
      const { id } = ctx.params;

      try {
        const job = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .updateJobStatus(parseInt(id));

        return ctx.send({ data: job, message: 'Job status refreshed' });
      } catch (error: any) {
        strapi.log.error('Failed to refresh job status', { id, error });
        return ctx.internalServerError('Failed to refresh job status');
      }
    },

    async delete(ctx) {
      const { id } = ctx.params;
      const { deleteArticle } = ctx.query;

      try {
        await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .deleteJob(parseInt(id), deleteArticle === 'true');

        return ctx.send({ message: 'Job deleted successfully' });
      } catch (error: any) {
        strapi.log.error('Failed to delete job', error);
        return ctx.internalServerError('Failed to delete job');
      }
    },

    async health(ctx) {
      try {
        const settings = await strapi
          .plugin('ai-youtube-article')
          .service('settings')
          .getSettings();

        const connectionResults = await strapi
          .plugin('ai-youtube-article')
          .service('connection')
          .test(settings);

        return ctx.send({
          status: 'ok',
          plugin: 'ai-youtube-article',
          services: connectionResults,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        const err = error;
        return ctx.send({
          status: 'error',
          plugin: 'ai-youtube-article',
          services: { status: 'error', message: err?.message },
          timestamp: new Date().toISOString(),
        });
      }
    },

    // Render article markdown to sanitized HTML (server-side) to keep admin bundle small
    async render(ctx) {
      const { id } = ctx.params;

      try {
        const job = await strapi.entityService.findOne(
          'plugin::ai-youtube-article.ai-job',
          parseInt(id, 10)
        );

        if (!job || !job.articleContent) {
          return ctx.notFound('Article content not available');
        }

        // Lazy load heavy markdown/sanitize libraries on server only
        const MarkdownIt = (await import('markdown-it')).default;
        const sanitizeHtml = (await import('sanitize-html')).default;

        const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
        const rawHtml = md.render(job.articleContent);
        const clean = sanitizeHtml(rawHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'pre', 'code']),
          allowedAttributes: {
            a: ['href', 'name', 'target', 'rel'],
            img: ['src', 'alt', 'title'],
            '*': ['class', 'id'],
          },
          transformTags: {
            'a': (tagName, attribs) => {
              const href = attribs.href || '';
              // Enforce rel and target for external links
              if (href && !href.startsWith('/') && !href.startsWith('#')) {
                attribs.target = '_blank';
                attribs.rel = 'noopener noreferrer';
              }
              return { tagName, attribs };
            },
          },
        });

        return ctx.send({ data: { html: clean } });
      } catch (error: any) {
        strapi.log.error('Failed to render article content', { id, error });
        return ctx.internalServerError('Failed to render article content');
      }
    },

    // New summary endpoint that returns counts for the dashboard
    async summary(ctx) {
      try {
        const summary = await strapi.plugin('ai-youtube-article').service('ai-job').getSummary();
        return ctx.send({ data: summary });
      } catch (error: any) {
        strapi.log.error('Failed to fetch jobs summary', error);
        return ctx.internalServerError('Failed to fetch jobs summary');
      }
    },

  })
);
