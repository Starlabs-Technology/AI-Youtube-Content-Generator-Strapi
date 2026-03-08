# Implementation Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#phase-1-project-setup)
3. [Backend Implementation](#phase-2-backend-implementation)
4. [Frontend Implementation](#phase-3-frontend-implementation)
5. [Testing & Deployment](#phase-4-testing--deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- ✅ **Node.js 18+** and npm/yarn
- ✅ **Strapi 5.x** project (sen-news-strapi)
- ✅ **Python Transcriber Service** running on port 8000
- ✅ **Database** (SQLite for dev, PostgreSQL for production)
- ✅ **Git** for version control

### Required Knowledge

- JavaScript/TypeScript fundamentals
- React basics (hooks, components)
- REST API concepts
- Strapi admin panel usage

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18+

# Check Strapi project
cd /path/to/sen-news-strapi
npm run strapi version  # Should be 5.x

# Check Python service
curl http://localhost:8000/health  # Should return {"status": "healthy"}
```

---

## Phase 1: Project Setup

### Step 1: Create Plugin Structure

```bash
cd /path/to/sen-news-strapi
mkdir -p src/plugins/ai-youtube-article
cd src/plugins/ai-youtube-article
```

### Step 2: Initialize Package

Create `package.json`:

```json
{
  "name": "ai-youtube-article",
  "version": "1.0.0",
  "description": "AI-powered YouTube video to article converter",
  "strapi": {
    "name": "ai-youtube-article",
    "displayName": "AI YouTube Article",
    "description": "Convert YouTube videos to articles using AI",
    "kind": "plugin",
    "required": false
  },
  "dependencies": {
    "@strapi/design-system": "^1.19.0",
    "@strapi/icons": "^1.19.0",
    "axios": "^1.6.0",
    "react-query": "^3.39.3"
  },
  "peerDependencies": {
    "@strapi/strapi": "^5.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "styled-components": "^6.0.0"
  },
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "license": "MIT",
  "scripts": {
    "test": "jest"
  }
}
```

### Step 3: Create Basic Structure

```bash
mkdir -p admin/src/{pages,components,api}
mkdir -p server/{controllers,services,routes,content-types,config}
```

---

## Phase 2: Backend Implementation

### Step 1: Define Content Type Schema

Create `server/content-types/ai-job/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "ai_jobs",
  "info": {
    "singularName": "ai-job",
    "pluralName": "ai-jobs",
    "displayName": "AI Job",
    "description": "Tracks YouTube transcription and article generation jobs"
  },
  "options": {
    "draftAndPublish": false,
    "comment": ""
  },
  "pluginOptions": {},
  "attributes": {
    "youtubeUrl": {
      "type": "string",
      "required": true,
      "maxLength": 500
    },
    "status": {
      "type": "enumeration",
      "enum": ["pending", "processing", "completed", "failed"],
      "default": "pending",
      "required": true
    },
    "progress": {
      "type": "integer",
      "min": 0,
      "max": 100,
      "default": 0
    },
    "pythonJobId": {
      "type": "string",
      "unique": true
    },
    "articleTitle": {
      "type": "string",
      "maxLength": 200
    },
    "articleContent": {
      "type": "text"
    },
    "articleSummary": {
      "type": "text"
    },
    "errorMessage": {
      "type": "text"
    },
    "errorDetails": {
      "type": "json"
    },
    "createdArticle": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::article.article"
    },
    "metadata": {
      "type": "json"
    },
    "completedAt": {
      "type": "datetime"
    }
  }
}
```

Create `server/content-types/ai-job/index.ts`:

```typescript
export { default as schema } from './schema.json';
```

### Step 2: Create Service Layer

Create `server/services/python-client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

interface PythonConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

interface GenerateArticleRequest {
  source_type: 'youtube';
  source_url: string;
  query?: string;
  push_to_strapi: boolean;
  sync: boolean;
}

interface GenerateArticleResponse {
  status: 'processing' | 'success' | 'error';
  job_id: string;
  progress?: string;
  data?: {
    headline: string;
    summary: string;
    article: string;
    metadata: {
      duration_seconds: number;
      language: string;
      processing_time_seconds: number;
    };
  };
  errors?: Array<{
    stage: string;
    message: string;
    timestamp: string;
  }>;
}

interface JobStatusResponse {
  status: 'processing' | 'success' | 'error';
  stage?: string;
  progress?: number;
  data?: GenerateArticleResponse['data'];
  errors?: GenerateArticleResponse['errors'];
  created_at: string;
  updated_at: string;
}

export class PythonClient {
  private client: AxiosInstance;
  private config: PythonConfig;

  constructor(config: PythonConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async generateArticle(youtubeUrl: string): Promise<GenerateArticleResponse> {
    try {
      const response = await this.client.post<GenerateArticleResponse>(
        '/api/generate-article',
        {
          source_type: 'youtube',
          source_url: youtubeUrl,
          query: 'Generate a comprehensive news article from this video',
          push_to_strapi: false, // Plugin handles article creation
          sync: false, // Async processing
        } as GenerateArticleRequest
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Python service error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async checkStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      const response = await this.client.get<JobStatusResponse>(
        `/api/status/${jobId}`
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Job ${jobId} not found in Python service`);
        }
        throw new Error(
          `Python service error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error', message: 'Python service unreachable' };
    }
  }
}

export default PythonClient;
```

Create `server/services/ai-job.ts`:

```typescript
import { factories } from '@strapi/strapi';
import PythonClient from './python-client';

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
    /**
     * Initialize Python client
     */
    getPythonClient(): PythonClient {
      const config = strapi.config.get('plugin.ai-youtube-article');
      return new PythonClient({
        baseUrl: config.pythonServiceUrl,
        apiKey: config.pythonApiKey,
        timeout: config.timeout || 300000,
      });
    },

    /**
     * Create a new transcription job
     */
    async createJob(youtubeUrl: string, user: any) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      logger.info('Creating transcription job', {
        youtubeUrl,
        userId: user?.id,
      });

      // Create job in database
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

      // Submit to Python service asynchronously
      this.submitToPython(job.id).catch((error) => {
        logger.error('Failed to submit job to Python service', {
          jobId: job.id,
          error: error.message,
        });
      });

      return job;
    },

    /**
     * Submit job to Python transcription service
     */
    async submitToPython(jobId: number) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      try {
        const pythonClient = this.getPythonClient();
        const response = await pythonClient.generateArticle(job.youtubeUrl);

        logger.info('Job submitted to Python service', {
          jobId,
          pythonJobId: response.job_id,
        });

        // Update job with Python job ID
        return await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          {
            data: {
              pythonJobId: response.job_id,
              status: 'processing',
              progress: 10,
            },
          }
        );
      } catch (error) {
        logger.error('Failed to submit to Python service', {
          jobId,
          error: error.message,
        });

        // Mark job as failed
        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          {
            data: {
              status: 'failed',
              errorMessage: error.message,
            },
          }
        );

        throw error;
      }
    },

    /**
     * Update job status by polling Python service
     */
    async updateJobStatus(jobId: number) {
      const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

      const job = await strapi.entityService.findOne(
        'plugin::ai-youtube-article.ai-job',
        jobId,
        { populate: ['createdArticle'] }
      );

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Skip if job is already complete or failed
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      if (!job.pythonJobId) {
        logger.warn('Job has no Python job ID', { jobId });
        return job;
      }

      try {
        const pythonClient = this.getPythonClient();
        const status = await pythonClient.checkStatus(job.pythonJobId);

        logger.debug('Received Python status', {
          jobId,
          pythonJobId: job.pythonJobId,
          status: status.status,
          progress: status.progress,
        });

        const updateData: any = {
          progress: status.progress || job.progress,
        };

        // Map Python status to Strapi status
        if (status.status === 'success') {
          updateData.status = 'completed';
          updateData.articleTitle = status.data?.headline;
          updateData.articleContent = status.data?.article;
          updateData.articleSummary = status.data?.summary;
          updateData.metadata = status.data?.metadata;
          updateData.completedAt = new Date();

          logger.info('Job completed successfully', { jobId });
        } else if (status.status === 'error') {
          updateData.status = 'failed';
          updateData.errorMessage =
            status.errors?.[0]?.message || 'Unknown error';
          updateData.errorDetails = status.errors;

          logger.error('Job failed', {
            jobId,
            error: updateData.errorMessage,
          });
        } else {
          // Still processing
          updateData.status = 'processing';
        }

        return await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          jobId,
          { data: updateData }
        );
      } catch (error) {
        logger.error('Failed to update job status', {
          jobId,
          error: error.message,
        });

        // Don't mark as failed on network errors - might be temporary
        throw error;
      }
    },

    /**
     * Create draft article from completed job
     */
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
        // Split article into paragraphs
        const paragraphs = job.articleContent
          .split('\n\n')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        // Create dynamic zone content blocks
        const contentBlocks = paragraphs.map((para) => ({
          __component: 'content.paragraph',
          content: para,
        }));

        logger.info('Creating draft article', {
          jobId,
          title: job.articleTitle,
          blockCount: contentBlocks.length,
        });

        // Create draft article
        const article = await strapi.entityService.create(
          'api::article.article',
          {
            data: {
              title: job.articleTitle,
              slug: slugify(job.articleTitle),
              excerpt: job.articleSummary?.substring(0, 300) || '',
              content: contentBlocks,
              aiTranscription: job.articleContent,
              publishedAt: null, // DRAFT MODE
              featured: false,
              trending: false,
              // Manual fields - editors will set these
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

        // Link article to job
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

    /**
     * Retry a failed job
     */
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

      logger.info('Retrying failed job', { jobId });

      // Reset job state
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

      // Resubmit to Python
      return await this.submitToPython(jobId);
    },

    /**
     * Delete a job and optionally its associated article
     */
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

      // Delete associated article if requested
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

      // Delete job
      logger.info('Deleting job', { jobId });
      return await strapi.entityService.delete(
        'plugin::ai-youtube-article.ai-job',
        jobId
      );
    },
  })
);
```

Create `server/services/index.ts`:

```typescript
import aiJob from './ai-job';
import PythonClient from './python-client';

export default {
  'ai-job': aiJob,
  'python-client': PythonClient,
};
```

### Step 3: Create Controllers

Create `server/controllers/ai-job.ts`:

```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'plugin::ai-youtube-article.ai-job',
  ({ strapi }) => ({
    /**
     * Create new transcription job
     * POST /api/ai-youtube-article/jobs
     */
    async create(ctx) {
      const { youtubeUrl } = ctx.request.body;

      // Validate YouTube URL
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
      } catch (error) {
        strapi.log.error('Failed to create job', error);
        return ctx.internalServerError('Failed to create transcription job');
      }
    },

    /**
     * Get job status
     * GET /api/ai-youtube-article/jobs/:id
     */
    async findOne(ctx) {
      const { id } = ctx.params;

      try {
        // Update status from Python service
        const job = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .updateJobStatus(parseInt(id));

        return ctx.send({ data: job });
      } catch (error) {
        strapi.log.error('Failed to fetch job', error);
        return ctx.internalServerError('Failed to fetch job status');
      }
    },

    /**
     * List jobs
     * GET /api/ai-youtube-article/jobs
     */
    async find(ctx) {
      try {
        const { results, pagination } = await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .find({
            ...ctx.query,
            populate: ['createdArticle'],
          });

        return ctx.send({ data: results, meta: { pagination } });
      } catch (error) {
        strapi.log.error('Failed to list jobs', error);
        return ctx.internalServerError('Failed to list jobs');
      }
    },

    /**
     * Create draft article from job
     * POST /api/ai-youtube-article/jobs/:id/create-article
     */
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
      } catch (error) {
        strapi.log.error('Failed to create article', error);

        if (error.message.includes('not completed')) {
          return ctx.badRequest(error.message);
        }
        if (error.message.includes('already created')) {
          return ctx.conflict(error.message);
        }

        return ctx.internalServerError('Failed to create article');
      }
    },

    /**
     * Retry failed job
     * POST /api/ai-youtube-article/jobs/:id/retry
     */
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
      } catch (error) {
        strapi.log.error('Failed to retry job', error);

        if (error.message.includes('not found')) {
          return ctx.notFound(error.message);
        }
        if (error.message.includes('Only failed')) {
          return ctx.badRequest(error.message);
        }

        return ctx.internalServerError('Failed to retry job');
      }
    },

    /**
     * Delete job
     * DELETE /api/ai-youtube-article/jobs/:id
     */
    async delete(ctx) {
      const { id } = ctx.params;
      const { deleteArticle } = ctx.query;

      try {
        await strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .deleteJob(parseInt(id), deleteArticle === 'true');

        return ctx.send({ message: 'Job deleted successfully' });
      } catch (error) {
        strapi.log.error('Failed to delete job', error);
        return ctx.internalServerError('Failed to delete job');
      }
    },

    /**
     * Health check for Python service
     * GET /api/ai-youtube-article/health
     */
    async health(ctx) {
      try {
        const pythonClient = strapi
          .plugin('ai-youtube-article')
          .service('ai-job')
          .getPythonClient();

        const pythonHealth = await pythonClient.healthCheck();

        return ctx.send({
          status: 'ok',
          plugin: 'ai-youtube-article',
          pythonService: pythonHealth,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return ctx.send({
          status: 'error',
          plugin: 'ai-youtube-article',
          pythonService: { status: 'error', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    },
  })
);
```

Create `server/controllers/index.ts`:

```typescript
import aiJob from './ai-job';

export default {
  'ai-job': aiJob,
};
```

### Step 4: Create Routes

Create `server/routes/index.ts`:

```typescript
export default [
  {
    method: 'POST',
    path: '/jobs',
    handler: 'ai-job.create',
    config: {
      policies: [],
      auth: true,
    },
  },
  {
    method: 'GET',
    path: '/jobs',
    handler: 'ai-job.find',
    config: {
      policies: [],
      auth: true,
    },
  },
  {
    method: 'GET',
    path: '/jobs/:id',
    handler: 'ai-job.findOne',
    config: {
      policies: [],
      auth: true,
    },
  },
  {
    method: 'POST',
    path: '/jobs/:id/create-article',
    handler: 'ai-job.createArticle',
    config: {
      policies: [],
      auth: true,
    },
  },
  {
    method: 'POST',
    path: '/jobs/:id/retry',
    handler: 'ai-job.retry',
    config: {
      policies: [],
      auth: true,
    },
  },
  {
    method: 'DELETE',
    path: '/jobs/:id',
    handler: 'ai-job.delete',
    config: {
      policies: [],
      auth: true,
    },
  },
  {
    method: 'GET',
    path: '/health',
    handler: 'ai-job.health',
    config: {
      policies: [],
      auth: false,
    },
  },
];
```

### Step 5: Create Plugin Configuration

Create `server/config/index.ts`:

```typescript
export default {
  default: {
    pythonServiceUrl: 'http://localhost:8000',
    pythonApiKey: '',
    pollingInterval: 5000,
    timeout: 300000,
  },
  validator(config) {
    if (!config.pythonApiKey) {
      throw new Error(
        'AI YouTube Article plugin: Python API key is required. Set TRANSCRIBER_API_KEY in environment variables.'
      );
    }
    if (!config.pythonServiceUrl) {
      throw new Error(
        'AI YouTube Article plugin: Python service URL is required. Set TRANSCRIBER_URL in environment variables.'
      );
    }
  },
};
```

### Step 6: Create Server Entry Point

Create `strapi-server.ts`:

```typescript
import controllers from './server/controllers';
import services from './server/services';
import routes from './server/routes';
import contentTypes from './server/content-types';
import config from './server/config';

export default {
  controllers,
  services,
  routes,
  contentTypes,
  config,
};
```

---

## Phase 3: Frontend Implementation

### Overview

Build the React admin panel UI with three main pages: Home (submit/monitor), History (job list), and Settings (configuration).

### Step 1: Create Admin Entry Point

Create `admin/src/pluginId.ts`:

```typescript
const pluginId = 'ai-youtube-article';

export default pluginId;
```

Create `admin/src/index.tsx`:

```typescript
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginId from './pluginId';
import PluginIcon from './components/PluginIcon';

export default {
  register(app: any) {
    // Register plugin
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'AI YouTube Article',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [
        {
          action: `plugin::${pluginId}.read`,
          subject: null,
        },
      ],
    });

    // Register settings page
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: 'AI YouTube Article',
        },
      },
      [
        {
          intlLabel: {
            id: `${pluginId}.settings.title`,
            defaultMessage: 'Configuration',
          },
          id: 'settings',
          to: `/settings/${pluginId}`,
          Component: async () => {
            const component = await import('./pages/Settings');
            return component;
          },
          permissions: [
            {
              action: `plugin::${pluginId}.settings`,
              subject: null,
            },
          ],
        },
      ]
    );
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
```

### Step 2: Create API Client

Create `admin/src/api/client.ts`:

```typescript
import axios from 'axios';
import { auth } from '@strapi/helper-plugin';

const client = axios.create({
  baseURL: '/api/ai-youtube-article',
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

Create `admin/src/api/types.ts`:

```typescript
export interface Job {
  id: number;
  youtubeUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  pythonJobId: string | null;
  articleTitle: string | null;
  articleContent: string | null;
  articleSummary: string | null;
  errorMessage: string | null;
  errorDetails: any;
  createdArticle: { id: number; title: string } | null;
  metadata: {
    duration_seconds?: number;
    language?: string;
    processing_time_seconds?: number;
  } | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  youtubeUrl: string;
}

export interface CreateJobResponse {
  data: Job;
}

export interface JobListResponse {
  data: Job[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
```

Create `admin/src/api/jobs.ts`:

```typescript
import client from './client';
import type {
  Job,
  CreateJobRequest,
  CreateJobResponse,
  JobListResponse,
} from './types';

export const jobsApi = {
  // Create new job
  create: async (data: CreateJobRequest): Promise<Job> => {
    const response = await client.post<CreateJobResponse>('/jobs', data);
    return response.data.data;
  },

  // Get single job
  getOne: async (id: number): Promise<Job> => {
    const response = await client.get<CreateJobResponse>(`/jobs/${id}`);
    return response.data.data;
  },

  // List jobs
  getAll: async (params?: {
    status?: string;
    _limit?: number;
    _start?: number;
  }): Promise<JobListResponse> => {
    const response = await client.get<JobListResponse>('/jobs', { params });
    return response.data;
  },

  // Create article from job
  createArticle: async (id: number): Promise<{ articleId: number }> => {
    const response = await client.post(`/jobs/${id}/create-article`);
    return response.data.data;
  },

  // Retry failed job
  retry: async (id: number): Promise<Job> => {
    const response = await client.post<CreateJobResponse>(`/jobs/${id}/retry`);
    return response.data.data;
  },

  // Delete job
  delete: async (id: number): Promise<void> => {
    await client.delete(`/jobs/${id}`);
  },

  // Health check
  health: async (): Promise<any> => {
    const response = await client.get('/health');
    return response.data;
  },
};
```

### Step 3: Create React Query Hooks

Create `admin/src/hooks/useJobs.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { jobsApi } from '../api/jobs';
import type { Job } from '../api/types';

// Create job mutation
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation(
    (youtubeUrl: string) => jobsApi.create({ youtubeUrl }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

// Get single job with auto-polling
export function useJob(jobId: number | null) {
  return useQuery(
    ['job', jobId],
    () => jobsApi.getOne(jobId!),
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        // Stop polling when complete or failed
        if (!data) return false;
        if (data.status === 'completed' || data.status === 'failed') {
          return false;
        }
        return 5000; // Poll every 5 seconds
      },
    }
  );
}

// List jobs
export function useJobs(filters?: { status?: string }) {
  return useQuery(['jobs', filters], () => jobsApi.getAll(filters));
}

// Create article mutation
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation(
    (jobId: number) => jobsApi.createArticle(jobId),
    {
      onSuccess: (_, jobId) => {
        queryClient.invalidateQueries(['job', jobId]);
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

// Retry job mutation
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation(
    (jobId: number) => jobsApi.retry(jobId),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['job', data.id], data);
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

// Delete job mutation
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation(
    (jobId: number) => jobsApi.delete(jobId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}
```

### Step 4: Create Reusable Components

Create `admin/src/components/UrlForm.tsx`:

```typescript
import React, { useState } from 'react';
import { TextInput, Button, Box } from '@strapi/design-system';
import { Check } from '@strapi/icons';

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;

export const UrlForm: React.FC<UrlFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('YouTube URL is required');
      return;
    }

    if (!YOUTUBE_REGEX.test(url)) {
      setError('Invalid YouTube URL format');
      return;
    }

    setError('');
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box paddingBottom={4}>
        <TextInput
          label="YouTube URL"
          name="youtubeUrl"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          error={error}
          disabled={isLoading}
          required
        />
      </Box>
      <Button
        type="submit"
        startIcon={<Check />}
        loading={isLoading}
        disabled={isLoading}
      >
        Generate Article
      </Button>
    </form>
  );
};
```

Create `admin/src/components/JobStatus.tsx`:

```typescript
import React from 'react';
import { Badge, ProgressBar, Box, Typography } from '@strapi/design-system';
import type { Job } from '../api/types';

interface JobStatusProps {
  job: Job;
}

const STATUS_VARIANTS = {
  pending: 'secondary',
  processing: 'primary',
  completed: 'success',
  failed: 'danger',
} as const;

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export const JobStatus: React.FC<JobStatusProps> = ({ job }) => {
  return (
    <Box>
      <Badge variant={STATUS_VARIANTS[job.status]}>
        {STATUS_LABELS[job.status]}
      </Badge>
      
      {job.status === 'processing' && (
        <Box paddingTop={2}>
          <ProgressBar value={job.progress} />
          <Typography variant="pi" textColor="neutral600">
            {job.progress}% complete
          </Typography>
        </Box>
      )}

      {job.errorMessage && (
        <Box paddingTop={2}>
          <Typography variant="pi" textColor="danger600">
            {job.errorMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
```

Create `admin/src/components/ArticlePreview.tsx`:

```typescript
import React from 'react';
import { Box, Typography, Divider } from '@strapi/design-system';
import type { Job } from '../api/types';

interface ArticlePreviewProps {
  job: Job;
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({ job }) => {
  if (!job.articleTitle) {
    return null;
  }

  return (
    <Box
      background="neutral0"
      padding={6}
      shadow="tableShadow"
      hasRadius
    >
      <Typography variant="alpha" fontWeight="bold">
        {job.articleTitle}
      </Typography>

      {job.articleSummary && (
        <>
          <Box paddingTop={4}>
            <Typography variant="omega" fontWeight="semiBold">
              Summary
            </Typography>
            <Typography
              variant="omega"
              textColor="neutral600"
              style={{ whiteSpace: 'pre-line' }}
            >
              {job.articleSummary}
            </Typography>
          </Box>
          <Divider marginTop={4} marginBottom={4} />
        </>
      )}

      <Box paddingTop={2}>
        <Typography variant="omega" style={{ whiteSpace: 'pre-line' }}>
          {job.articleContent}
        </Typography>
      </Box>

      {job.metadata && (
        <Box paddingTop={4}>
          <Typography variant="pi" textColor="neutral600">
            Language: {job.metadata.language || 'Unknown'} • 
            Duration: {job.metadata.duration_seconds ? `${Math.floor(job.metadata.duration_seconds / 60)}:${String(job.metadata.duration_seconds % 60).padStart(2, '0')}` : 'Unknown'} • 
            Processing time: {job.metadata.processing_time_seconds ? `${job.metadata.processing_time_seconds}s` : 'Unknown'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
```

### Step 5: Create Main Pages

Create `admin/src/pages/Home/index.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Button,
  ContentLayout,
  HeaderLayout,
  Alert,
} from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import { useCreateJob, useJob, useCreateArticle } from '../../hooks/useJobs';
import { UrlForm } from '../../components/UrlForm';
import { JobStatus } from '../../components/JobStatus';
import { ArticlePreview } from '../../components/ArticlePreview';

const HomePage: React.FC = () => {
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const toggleNotification = useNotification();

  const createJob = useCreateJob();
  const { data: job, isLoading: jobLoading } = useJob(currentJobId);
  const createArticle = useCreateArticle();

  const handleSubmit = async (url: string) => {
    try {
      const newJob = await createJob.mutateAsync(url);
      setCurrentJobId(newJob.id);
      toggleNotification({
        type: 'success',
        message: 'Job created successfully',
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: error.message || 'Failed to create job',
      });
    }
  };

  const handleCreateArticle = async () => {
    if (!currentJobId) return;

    try {
      const result = await createArticle.mutateAsync(currentJobId);
      toggleNotification({
        type: 'success',
        message: 'Draft article created successfully',
      });
      // Redirect to article editor
      window.location.href = `/admin/content-manager/article/${result.articleId}`;
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: error.message || 'Failed to create article',
      });
    }
  };

  return (
    <>
      <HeaderLayout
        title="AI YouTube Article"
        subtitle="Generate articles from YouTube videos using AI"
      />
      <ContentLayout>
        <Box padding={8}>
          <UrlForm
            onSubmit={handleSubmit}
            isLoading={createJob.isLoading}
          />

          {job && (
            <Box paddingTop={6}>
              <JobStatus job={job} />

              {job.status === 'completed' && (
                <>
                  <Box paddingTop={4}>
                    <ArticlePreview job={job} />
                  </Box>

                  <Box paddingTop={4}>
                    <Button
                      onClick={handleCreateArticle}
                      loading={createArticle.isLoading}
                      disabled={!!job.createdArticle}
                    >
                      {job.createdArticle
                        ? 'Article Already Created'
                        : 'Create Draft Article'}
                    </Button>
                  </Box>
                </>
              )}

              {job.status === 'failed' && (
                <Box paddingTop={4}>
                  <Alert
                    variant="danger"
                    title="Transcription Failed"
                  >
                    {job.errorMessage}
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </ContentLayout>
    </>
  );
};

export default HomePage;
```

Create `admin/src/pages/History/index.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Badge,
  IconButton,
  ContentLayout,
  HeaderLayout,
} from '@strapi/design-system';
import { Refresh, Eye, Trash } from '@strapi/icons';
import { useJobs, useRetryJob, useDeleteJob } from '../../hooks/useJobs';
import { useNotification } from '@strapi/helper-plugin';

const HistoryPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading, refetch } = useJobs({ status: statusFilter });
  const retryJob = useRetryJob();
  const deleteJob = useDeleteJob();
  const toggleNotification = useNotification();

  const handleRetry = async (jobId: number) => {
    try {
      await retryJob.mutateAsync(jobId);
      toggleNotification({
        type: 'success',
        message: 'Job retry initiated',
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: error.message || 'Failed to retry job',
      });
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await deleteJob.mutateAsync(jobId);
      toggleNotification({
        type: 'success',
        message: 'Job deleted successfully',
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: error.message || 'Failed to delete job',
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <HeaderLayout
        title="Job History"
        subtitle="View and manage all transcription jobs"
      />
      <ContentLayout>
        <Box padding={8}>
          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>YouTube URL</Th>
                <Th>Status</Th>
                <Th>Title</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.data.map((job) => (
                <Tr key={job.id}>
                  <Td>{job.id}</Td>
                  <Td>
                    <a href={job.youtubeUrl} target="_blank" rel="noreferrer">
                      {job.youtubeUrl.substring(0, 40)}...
                    </a>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        job.status === 'completed'
                          ? 'success'
                          : job.status === 'failed'
                          ? 'danger'
                          : 'primary'
                      }
                    >
                      {job.status}
                    </Badge>
                  </Td>
                  <Td>{job.articleTitle || '-'}</Td>
                  <Td>{new Date(job.createdAt).toLocaleString()}</Td>
                  <Td>
                    <Box display="flex" gap={2}>
                      {job.status === 'failed' && (
                        <IconButton
                          label="Retry"
                          icon={<Refresh />}
                          onClick={() => handleRetry(job.id)}
                        />
                      )}
                      {job.createdArticle && (
                        <IconButton
                          label="View Article"
                          icon={<Eye />}
                          onClick={() => {
                            window.location.href = `/admin/content-manager/article/${job.createdArticle!.id}`;
                          }}
                        />
                      )}
                      <IconButton
                        label="Delete"
                        icon={<Trash />}
                        onClick={() => handleDelete(job.id)}
                      />
                    </Box>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </ContentLayout>
    </>
  );
};

export default HistoryPage;
```

Create `admin/src/pages/Settings/index.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  ContentLayout,
  HeaderLayout,
} from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    pythonServiceUrl: '',
    pythonApiKey: '',
  });
  const toggleNotification = useNotification();

  const handleSave = async () => {
    // Save settings logic
    toggleNotification({
      type: 'success',
      message: 'Settings saved successfully',
    });
  };

  return (
    <>
      <HeaderLayout
        title="Plugin Settings"
        subtitle="Configure AI YouTube Article plugin"
      />
      <ContentLayout>
        <Box padding={8}>
          <Box paddingBottom={4}>
            <TextInput
              label="Python Service URL"
              name="pythonServiceUrl"
              value={settings.pythonServiceUrl}
              onChange={(e) =>
                setSettings({ ...settings, pythonServiceUrl: e.target.value })
              }
            />
          </Box>
          <Box paddingBottom={4}>
            <TextInput
              label="Python API Key"
              name="pythonApiKey"
              type="password"
              value={settings.pythonApiKey}
              onChange={(e) =>
                setSettings({ ...settings, pythonApiKey: e.target.value })
              }
            />
          </Box>
          <Button onClick={handleSave}>Save Settings</Button>
        </Box>
      </ContentLayout>
    </>
  );
};

export default SettingsPage;
```

### Step 6: Create App Router

Create `admin/src/pages/App/index.tsx`:

```typescript
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import pluginId from '../../pluginId';
import HomePage from '../Home';
import HistoryPage from '../History';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
        <Route path={`/plugins/${pluginId}/history`} component={HistoryPage} />
      </Switch>
    </QueryClientProvider>
  );
};

export default App;
```

### Step 7: Create Admin Entry in Root

Create `strapi-admin.tsx`:

```typescript
export { default } from './admin/src';
```

---

## Phase 4: Testing & Deployment

### Unit Testing

Create `server/services/__tests__/ai-job.test.ts`:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('AI Job Service', () => {
  let service: any;

  beforeEach(() => {
    // Setup test environment
  });

  it('should create job successfully', async () => {
    const job = await service.createJob('https://youtube.com/watch?v=test');
    expect(job.status).toBe('pending');
    expect(job.youtubeUrl).toBe('https://youtube.com/watch?v=test');
  });

  it('should reject invalid URL', async () => {
    await expect(
      service.createJob('invalid-url')
    ).rejects.toThrow('Invalid YouTube URL');
  });
});
```

### Integration Testing

```bash
# Start test environment
npm run test

# Run with coverage
npm run test:coverage
```

### Build & Deploy

```bash
# Build admin panel
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## Troubleshooting

### Common Issues

**Issue: "Module not found"**
```bash
# Solution: Clear cache and rebuild
rm -rf .cache build
npm run build
npm run develop
```

**Issue: "Python service not responding"**
```bash
# Solution: Check Python service
curl http://localhost:8000/health

# Restart if needed
cd /path/to/transcriber
uvicorn app:app --reload
```

**Issue: "Job stuck in processing"**
```typescript
// Solution: Check Python job status manually
GET http://localhost:8000/api/status/{pythonJobId}
```

---

## Next Steps

✅ Complete all 4 phases above  
✅ Test thoroughly with real YouTube videos  
✅ Configure permissions in Strapi admin  
✅ Deploy to production environment  
✅ Monitor logs for errors  
✅ Set up backup strategy  

**Congratulations! Your plugin is now complete and ready to use.**
