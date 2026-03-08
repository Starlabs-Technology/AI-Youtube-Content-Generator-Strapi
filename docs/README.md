# AI YouTube Article Plugin

**Version:** 1.0.0  
**Strapi Compatibility:** 5.x  
**Status:** Implementation Ready

## Overview

The **AI YouTube Article** plugin integrates YouTube video transcription and AI-powered article generation directly into the Strapi admin panel. It provides editors with a streamlined workflow to submit YouTube URLs, monitor processing status, review generated content, and create draft articles—all without leaving the CMS.

This plugin acts as a **workflow orchestrator** that bridges the Strapi content management system with a Python-based transcription and AI generation service.

## Key Features

- ✅ **YouTube URL Submission** - Simple form interface in Strapi admin
- ✅ **Real-time Job Tracking** - Monitor transcription and generation progress
- ✅ **Article Preview** - Review generated content before publishing
- ✅ **Draft Article Creation** - One-click draft creation with full editorial control
- ✅ **Job History** - View, retry, and manage all transcription jobs
- ✅ **Configurable Settings** - Admin-only configuration for Python service
- ✅ **Role-based Access** - Integrates with Strapi permissions system
- ✅ **Error Recovery** - Retry failed jobs with detailed error messages

## Architecture

```
┌─────────────────────────────────────────┐
│   Strapi Admin Panel                    │
│   ┌───────────────────────────────┐     │
│   │ AI YouTube Article Plugin     │     │
│   │ • Submit URL                  │     │
│   │ • View Status                 │     │
│   │ • Preview Article             │     │
│   │ • Create Draft                │     │
│   │ • Job History                 │     │
│   │ • Settings                    │     │
│   └───────────┬───────────────────┘     │
└───────────────┼─────────────────────────┘
                │
                │ REST API
                ▼
┌─────────────────────────────────────────┐
│   Plugin Backend (Node.js)              │
│   • Job Management                      │
│   • Python Service Integration          │
│   • Article Creation                    │
│   • Status Polling                      │
└───────────────┬─────────────────────────┘
                │
                │ HTTP/REST
                ▼
┌─────────────────────────────────────────┐
│   Python FastAPI Service                │
│   • YouTube Download (yt-dlp)           │
│   • Audio Transcription (Whisper)       │
│   • RAG Context Retrieval (FAISS)       │
│   • AI Generation (Gemini 2.5)          │
└─────────────────────────────────────────┘
```

## Technical Stack

### Frontend
- **React 18** - Admin UI components
- **Strapi Design System** - Consistent UI/UX
- **React Query** - Data fetching and caching
- **Styled Components** - Component styling

### Backend
- **Node.js** - Plugin server logic
- **Strapi 5.x APIs** - Content type management
- **Axios** - HTTP client for Python service
- **SQLite/PostgreSQL** - Job persistence

### External Service
- **Python FastAPI** - Transcription service
- **OpenAI Whisper** - Speech-to-text
- **Google Gemini AI** - Article generation
- **yt-dlp** - YouTube download

## Prerequisites

1. **Strapi 5.x** installation
2. **Python Transcriber Service** running and accessible
3. **Node.js 18+** and **npm/yarn**
4. **Database** configured (SQLite/PostgreSQL/MySQL)

## Documentation Overview

This plugin includes comprehensive documentation in separate files:

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **README.md** (this file) | Features, installation, user guide | All users | 15 min |
| [GETTING_STARTED.md](../GETTING_STARTED.md) | Quick overview and learning path | New users | 5 min |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Step-by-step build instructions | Developers | 60 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design and data flow | Technical leads | 30 min |
| [API_REFERENCE.md](API_REFERENCE.md) | Complete REST API docs | API integrators | 20 min |

**Quick Navigation:**
- 🌟 **Brand new?** Start with [GETTING_STARTED.md](../GETTING_STARTED.md) for a quick overview
- 🚀 **Installing?** Jump to [Quick Start](#quick-start) below
- 👨‍💻 **Building from scratch?** Follow [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) step-by-step
- 🏗️ **Understanding design?** Read [ARCHITECTURE.md](ARCHITECTURE.md) for system architecture
- 📡 **API integration?** See [API_REFERENCE.md](API_REFERENCE.md) for endpoint details

## Quick Start

### 1. Installation

```bash
# Navigate to Strapi project root
cd /path/to/sen-news-strapi

# Create plugin directory
mkdir -p src/plugins/ai-youtube-article

# Copy plugin files
cp -r /path/to/ai-youtube-article-plugin/* src/plugins/ai-youtube-article/

# Install dependencies (if plugin has its own)
cd src/plugins/ai-youtube-article
npm install
```

### 2. Configuration

Add plugin configuration to `config/plugins.ts`:

```typescript
export default {
  'ai-youtube-article': {
    enabled: true,
    config: {
      pythonServiceUrl: env('TRANSCRIBER_URL', 'http://localhost:8000'),
      pythonApiKey: env('TRANSCRIBER_API_KEY'),
      pollingInterval: 5000, // 5 seconds
      timeout: 300000, // 5 minutes
    }
  }
};
```

### 3. Environment Variables

Add to `.env`:

```bash
TRANSCRIBER_URL=http://localhost:8000
TRANSCRIBER_API_KEY=supersecret
```

### 4. Enable Plugin

The plugin auto-registers when placed in `src/plugins/`. Rebuild admin panel:

```bash
npm run build
npm run develop
```

### 5. Access Plugin

Navigate to **Plugins → AI YouTube Article** in Strapi admin panel.

## User Guide

### Submitting a YouTube Video

1. Click **"AI YouTube Article"** in the admin sidebar
2. Paste YouTube URL (e.g., `https://youtube.com/watch?v=...`)
3. Click **"Generate Article"**
4. Monitor real-time status updates

### Job Status Indicators

| Status | Description | Action |
|--------|-------------|--------|
| 🟡 Pending | Job queued | Wait |
| 🔵 Processing | Transcription/generation in progress | Monitor |
| 🟢 Completed | Article ready for review | Preview/Create |
| 🔴 Failed | Error occurred | View error/Retry |

### Reviewing Generated Content

Once completed:

1. **Preview Panel** shows:
   - Article title
   - Summary (bullet points)
   - Full article content
   - Detected language
   - Processing time

2. **Edit Options:**
   - View as formatted text
   - See raw content blocks

### Creating a Draft Article

1. Review generated content
2. Click **"Create Draft Article"**
3. Plugin creates article with:
   - `publishedAt: null` (draft mode)
   - `aiTranscription` field populated
   - Dynamic zone `content` blocks
4. Redirects to Content Manager for editing

### Job History

Access via **"History"** tab:

- View all past jobs
- Filter by status
- Retry failed jobs
- Open related articles
- Delete old jobs

### Settings (Admin Only)

Configure via **"Settings"** tab:

- Python service URL
- API authentication key
- Polling interval
- Request timeout
- Default language

## Developer Guide

### Plugin Structure

### Complete Folder and File Structure

```
ai-youtube-article/                          # Plugin root directory
│
├── 📄 package.json                          # Plugin metadata and dependencies
├── 📄 README.md                             # Main documentation (this file)
├── 📄 ARCHITECTURE.md                       # System architecture and design decisions
├── 📄 IMPLEMENTATION_GUIDE.md               # Step-by-step development guide
├── 📄 API_REFERENCE.md                      # Complete API documentation
│
├── 📄 strapi-admin.tsx                      # Admin panel entry point (registers UI)
├── 📄 strapi-server.ts                      # Server entry point (registers backend)
│
├── 📁 admin/                                # Frontend React application
│   └── src/
│       ├── 📄 index.tsx                     # Plugin registration, routes, navigation
│       ├── 📄 pluginId.ts                   # Plugin identifier constant
│       │
│       ├── 📁 pages/                        # Admin panel pages
│       │   ├── 📁 Home/
│       │   │   ├── 📄 index.tsx             # Main page: submit URL, view status, preview
│       │   │   └── 📄 styles.ts             # Styled components
│       │   │
│       │   ├── 📁 History/
│       │   │   ├── 📄 index.tsx             # Job history table with filters
│       │   │   └── 📄 styles.ts             # Styled components
│       │   │
│       │   └── 📁 Settings/
│       │       ├── 📄 index.tsx             # Plugin configuration (admin only)
│       │       └── 📄 styles.ts             # Styled components
│       │
│       ├── 📁 components/                   # Reusable UI components
│       │   ├── 📄 UrlForm.tsx               # YouTube URL input with validation
│       │   ├── 📄 JobStatus.tsx             # Status badge and progress bar
│       │   ├── 📄 ArticlePreview.tsx        # Generated article preview
│       │   ├── 📄 JobTable.tsx              # Paginated job table
│       │   ├── 📄 ErrorAlert.tsx            # Error message display
│       │   └── 📄 LoadingSpinner.tsx        # Loading indicator
│       │
│       ├── 📁 hooks/                        # Custom React hooks
│       │   ├── 📄 useJobs.ts                # React Query hooks for jobs API
│       │   ├── 📄 useJobStatus.ts           # Auto-polling job status hook
│       │   └── 📄 useConfig.ts              # Plugin settings hook
│       │
│       ├── 📁 api/                          # API client layer
│       │   ├── 📄 client.ts                 # Axios instance with auth
│       │   ├── 📄 jobs.ts                   # Job API methods
│       │   └── 📄 types.ts                  # TypeScript interfaces
│       │
│       └── 📁 utils/                        # Helper functions
│           ├── 📄 validation.ts             # URL validation, form helpers
│           ├── 📄 formatters.ts             # Date/time formatting
│           └── 📄 constants.ts              # Constants (statuses, intervals)
│
└── 📁 server/                               # Backend Node.js/TypeScript
    │
    ├── 📄 bootstrap.ts                      # Plugin initialization logic
    ├── 📄 destroy.ts                        # Cleanup on plugin disable
    ├── 📄 register.ts                       # Register services/policies
    │
    ├── 📁 config/                           # Plugin configuration
    │   └── 📄 index.ts                      # Config schema and validation
    │
    ├── 📁 content-types/                    # Custom content types
    │   ├── 📁 ai-job/                       # Job tracking content type
    │   │   ├── 📄 schema.json               # Database schema definition
    │   │   ├── 📄 lifecycles.ts             # Lifecycle hooks (optional)
    │   │   └── 📄 index.ts                  # Content type export
    │   │
    │   └── 📄 index.ts                      # Export all content types
    │
    ├── 📁 controllers/                      # HTTP request handlers
    │   ├── 📄 ai-job.ts                     # Job CRUD operations
    │   ├── 📄 health.ts                     # Health check endpoint
    │   └── 📄 index.ts                      # Export all controllers
    │
    ├── 📁 services/                         # Business logic layer
    │   ├── 📄 ai-job.ts                     # Job management service
    │   ├── 📄 python-client.ts              # Python API integration
    │   ├── 📄 article-creator.ts            # Article creation logic
    │   └── 📄 index.ts                      # Export all services
    │
    ├── 📁 routes/                           # API route definitions
    │   ├── 📄 index.ts                      # Main routes (jobs CRUD)
    │   └── 📄 admin.ts                      # Admin-only routes (settings)
    │
    ├── 📁 policies/                         # Custom policies (optional)
    │   ├── 📄 is-job-owner.ts               # Check if user owns job
    │   └── 📄 rate-limit.ts                 # Rate limiting policy
    │
    ├── 📁 middlewares/                      # Custom middlewares (optional)
    │   └── 📄 logger.ts                     # Request logging
    │
    └── 📁 utils/                            # Helper utilities
        ├── 📄 slugify.ts                    # Text slugification
        ├── 📄 validators.ts                 # Input validation
        └── 📄 errors.ts                     # Custom error classes
```

### File Purpose Summary

#### **Root Files**
- **package.json** - Defines plugin metadata, dependencies, Strapi compatibility
- **README.md** - User guide, installation, features, API overview
- **ARCHITECTURE.md** - System design, data flow, integration patterns
- **IMPLEMENTATION_GUIDE.md** - Step-by-step development instructions
- **API_REFERENCE.md** - Complete REST API documentation
- **strapi-admin.tsx** - Registers admin UI (imports admin/src/index.tsx)
- **strapi-server.ts** - Registers backend services, routes, controllers

#### **Admin (Frontend)**
- **pages/** - Full-page views in admin panel (Home, History, Settings)
- **components/** - Reusable UI building blocks (forms, tables, alerts)
- **hooks/** - React hooks for data fetching and state management
- **api/** - HTTP client and API method definitions
- **utils/** - Helper functions (validation, formatting, constants)

#### **Server (Backend)**
- **bootstrap.ts** - Runs once when plugin loads (initialize services)
- **config/index.ts** - Plugin settings schema and validation rules
- **content-types/** - Database models (ai-job schema)
- **controllers/** - Handle HTTP requests, validate input, return responses
- **services/** - Business logic (job creation, Python API calls, article generation)
- **routes/** - Map URLs to controller methods (GET /jobs, POST /jobs)
- **policies/** - Reusable authorization checks (optional)
- **middlewares/** - Request/response interceptors (optional)
- **utils/** - Shared helper functions

### Key Concepts

**Separation of Concerns:**
- Controllers handle HTTP → Services handle logic → Python client handles external API
- React components → Hooks → API client

**Data Flow:**
```
User Input → Controller → Service → Python API → Database → Response → UI
```

**File Naming Convention:**
- **PascalCase** for React components (UrlForm.tsx)
- **kebab-case** for routes and content types (ai-job)
- **camelCase** for services and utilities (pythonClient)

**Required vs Optional:**
- ✅ Required: strapi-server.ts, strapi-admin.tsx, package.json, content-types, controllers, services, routes
- 🔵 Optional: policies, middlewares, lifecycles, hooks, utils (but recommended)

### Data Model: ai-job

The plugin creates a custom content type to track jobs:

```json
{
  "kind": "collectionType",
  "collectionName": "ai_jobs",
  "info": {
    "singularName": "ai-job",
    "pluralName": "ai-jobs",
    "displayName": "AI Job"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "youtubeUrl": {
      "type": "string",
      "required": true
    },
    "status": {
      "type": "enumeration",
      "enum": ["pending", "processing", "completed", "failed"],
      "default": "pending"
    },
    "progress": {
      "type": "integer",
      "min": 0,
      "max": 100,
      "default": 0
    },
    "pythonJobId": {
      "type": "string"
    },
    "articleTitle": {
      "type": "string"
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

### API Endpoints

#### Submit Job

```http
POST /api/ai-youtube-article/jobs
Content-Type: application/json
Authorization: Bearer {strapi-token}

{
  "youtubeUrl": "https://youtube.com/watch?v=..."
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "youtubeUrl": "https://youtube.com/watch?v=...",
    "status": "pending",
    "pythonJobId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-01-05T10:00:00.000Z"
  }
}
```

#### Get Job Status

```http
GET /api/ai-youtube-article/jobs/:id
Authorization: Bearer {strapi-token}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "status": "completed",
    "progress": 100,
    "articleTitle": "Understanding AI in 2026",
    "articleContent": "Full article text...",
    "articleSummary": "• Key point 1\n• Key point 2",
    "metadata": {
      "language": "en",
      "duration": "15:30",
      "processingTime": 45
    }
  }
}
```

#### List Jobs

```http
GET /api/ai-youtube-article/jobs?status=completed&_limit=25
Authorization: Bearer {strapi-token}
```

#### Create Draft Article

```http
POST /api/ai-youtube-article/jobs/:id/create-article
Authorization: Bearer {strapi-token}
```

**Response:**
```json
{
  "data": {
    "articleId": 42,
    "jobId": 1,
    "message": "Draft article created successfully"
  }
}
```

#### Retry Failed Job

```http
POST /api/ai-youtube-article/jobs/:id/retry
Authorization: Bearer {strapi-token}
```

### Python Service Integration

#### Request Format

```typescript
// services/python-client.ts
async function generateArticle(youtubeUrl: string) {
  const response = await axios.post(
    `${PYTHON_URL}/api/generate-article`,
    {
      source_type: 'youtube',
      source_url: youtubeUrl,
      query: 'Generate a news article from this video',
      push_to_strapi: false, // Plugin handles creation
      sync: false            // Async processing
    },
    {
      headers: {
        'x-api-key': PYTHON_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds for initial submission
    }
  );
  
  return response.data;
}
```

#### Response Format

```json
{
  "status": "processing",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "progress": "Transcribing audio..."
}
```

#### Status Polling

```typescript
async function checkJobStatus(pythonJobId: string) {
  const response = await axios.get(
    `${PYTHON_URL}/api/status/${pythonJobId}`,
    {
      headers: { 'x-api-key': PYTHON_API_KEY },
      timeout: 5000
    }
  );
  
  return response.data;
}
```

**Response when processing:**
```json
{
  "status": "processing",
  "stage": "rag_context",
  "progress": 60,
  "created_at": "2026-01-05T10:00:00",
  "updated_at": "2026-01-05T10:02:30"
}
```

**Response when complete:**
```json
{
  "status": "success",
  "data": {
    "headline": "AI Revolution Continues",
    "summary": "• Point 1\n• Point 2\n• Point 3",
    "article": "Full article text with paragraphs...",
    "metadata": {
      "duration_seconds": 930,
      "language": "en",
      "processing_time_seconds": 45
    }
  }
}
```

### Article Creation Logic

The plugin transforms Python service output into Strapi Article format:

```typescript
// services/ai-job.ts
async function createArticleFromJob(jobId: number) {
  const job = await strapi.entityService.findOne(
    'plugin::ai-youtube-article.ai-job',
    jobId
  );
  
  if (job.status !== 'completed') {
    throw new Error('Job not completed');
  }
  
  // Split article into paragraphs
  const paragraphs = job.articleContent
    .split('\n\n')
    .filter(p => p.trim().length > 0);
  
  // Create dynamic zone blocks
  const contentBlocks = paragraphs.map(para => ({
    __component: 'content.paragraph',
    content: para
  }));
  
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
        // Manual fields set to null for editorial assignment
        category: null,
        author: null,
        tags: [],
        coverImage: null
      }
    }
  );
  
  // Link article to job
  await strapi.entityService.update(
    'plugin::ai-youtube-article.ai-job',
    jobId,
    {
      data: {
        createdArticle: article.id,
        completedAt: new Date()
      }
    }
  );
  
  return article;
}
```

### Status Polling Strategy

**Frontend Implementation:**

```typescript
// admin/src/api/jobs.ts
export function useJobStatus(jobId: number) {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => fetchJobStatus(jobId),
    refetchInterval: (data) => {
      // Stop polling when job is complete or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
    enabled: !!jobId
  });
}
```

**Backend Implementation:**

```typescript
// server/services/ai-job.ts
async function updateJobStatus(jobId: number) {
  const job = await strapi.entityService.findOne(
    'plugin::ai-youtube-article.ai-job',
    jobId
  );
  
  if (!job.pythonJobId || job.status === 'completed' || job.status === 'failed') {
    return job;
  }
  
  try {
    const pythonStatus = await pythonClient.checkStatus(job.pythonJobId);
    
    const updateData: any = {
      status: pythonStatus.status === 'success' ? 'completed' : 
              pythonStatus.status === 'error' ? 'failed' : 
              'processing',
      progress: pythonStatus.progress || 0
    };
    
    if (pythonStatus.status === 'success' && pythonStatus.data) {
      updateData.articleTitle = pythonStatus.data.headline;
      updateData.articleContent = pythonStatus.data.article;
      updateData.articleSummary = pythonStatus.data.summary;
      updateData.metadata = pythonStatus.data.metadata;
      updateData.completedAt = new Date();
    }
    
    if (pythonStatus.status === 'error') {
      updateData.errorMessage = pythonStatus.errors?.[0]?.message || 'Unknown error';
      updateData.errorDetails = pythonStatus.errors;
    }
    
    return await strapi.entityService.update(
      'plugin::ai-youtube-article.ai-job',
      jobId,
      { data: updateData }
    );
  } catch (error) {
    // Handle network errors
    await strapi.entityService.update(
      'plugin::ai-youtube-article.ai-job',
      jobId,
      {
        data: {
          status: 'failed',
          errorMessage: `Failed to communicate with Python service: ${error.message}`
        }
      }
    );
    throw error;
  }
}
```

## Permissions & Security

### Role-Based Access

Configure in **Settings → Users & Permissions Plugin → Roles**:

#### Editor Role
- ✅ Create jobs
- ✅ View own jobs
- ✅ View job status
- ✅ Create draft articles
- ❌ Delete jobs
- ❌ Access settings

#### Admin Role
- ✅ All editor permissions
- ✅ View all jobs
- ✅ Delete jobs
- ✅ Retry failed jobs
- ✅ Configure plugin settings

### API Token Security

```typescript
// server/config/index.ts
export default {
  default: {
    pythonServiceUrl: 'http://localhost:8000',
    pythonApiKey: '',
    pollingInterval: 5000,
    timeout: 300000
  },
  validator: (config) => {
    if (!config.pythonApiKey) {
      throw new Error('Python API key is required');
    }
    if (!config.pythonServiceUrl) {
      throw new Error('Python service URL is required');
    }
  }
};
```

### Input Validation

```typescript
// server/controllers/ai-job.ts
async create(ctx) {
  const { youtubeUrl } = ctx.request.body;
  
  // Validate YouTube URL
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
  
  if (!youtubeUrl || !youtubeRegex.test(youtubeUrl)) {
    return ctx.badRequest('Invalid YouTube URL');
  }
  
  // Rate limiting (optional)
  const recentJobs = await strapi.entityService.findMany(
    'plugin::ai-youtube-article.ai-job',
    {
      filters: {
        createdBy: ctx.state.user.id,
        createdAt: { $gt: new Date(Date.now() - 3600000) } // Last hour
      }
    }
  );
  
  if (recentJobs.length >= 10) {
    return ctx.tooManyRequests('Rate limit exceeded. Please try again later.');
  }
  
  // Create job
  const job = await strapi.service('plugin::ai-youtube-article.ai-job')
    .create(youtubeUrl, ctx.state.user);
  
  return ctx.created(job);
}
```

## Error Handling

### Frontend Error Display

```tsx
// admin/src/components/JobStatus.tsx
{job.status === 'failed' && (
  <Alert variant="danger" closeLabel="Close">
    <AlertTitle>Transcription Failed</AlertTitle>
    <AlertBody>
      {job.errorMessage}
    </AlertBody>
    <AlertFooter>
      <Button variant="tertiary" onClick={handleRetry}>
        Retry Job
      </Button>
    </AlertFooter>
  </Alert>
)}
```

### Backend Error Categories

```typescript
// server/services/ai-job.ts
class TranscriptionError extends Error {
  constructor(message: string, public stage: string, public details?: any) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

class PythonServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'PythonServiceError';
  }
}

class ArticleCreationError extends Error {
  constructor(message: string, public jobId: number) {
    super(message);
    this.name = 'ArticleCreationError';
  }
}
```

### Error Recovery

```typescript
// server/services/ai-job.ts
async function retryJob(jobId: number) {
  const job = await strapi.entityService.findOne(
    'plugin::ai-youtube-article.ai-job',
    jobId
  );
  
  if (job.status !== 'failed') {
    throw new Error('Only failed jobs can be retried');
  }
  
  // Reset job state
  await strapi.entityService.update(
    'plugin::ai-youtube-article.ai-job',
    jobId,
    {
      data: {
        status: 'pending',
        progress: 0,
        errorMessage: null,
        errorDetails: null,
        pythonJobId: null
      }
    }
  );
  
  // Resubmit to Python service
  return await submitJobToPython(jobId);
}
```

## Testing

### Unit Tests

```typescript
// server/services/__tests__/ai-job.test.ts
describe('AI Job Service', () => {
  describe('createArticleFromJob', () => {
    it('should create draft article from completed job', async () => {
      const job = {
        id: 1,
        status: 'completed',
        articleTitle: 'Test Article',
        articleContent: 'Paragraph 1\n\nParagraph 2',
        articleSummary: 'Summary'
      };
      
      const article = await aiJobService.createArticleFromJob(job.id);
      
      expect(article.title).toBe('Test Article');
      expect(article.publishedAt).toBeNull();
      expect(article.content).toHaveLength(2);
      expect(article.content[0].__component).toBe('content.paragraph');
    });
    
    it('should throw error for incomplete job', async () => {
      const job = { id: 1, status: 'processing' };
      
      await expect(
        aiJobService.createArticleFromJob(job.id)
      ).rejects.toThrow('Job not completed');
    });
  });
});
```

### Integration Tests

```typescript
// server/__tests__/integration/job-flow.test.ts
describe('Complete Job Flow', () => {
  it('should process YouTube video end-to-end', async () => {
    // 1. Submit job
    const job = await strapi.service('plugin::ai-youtube-article.ai-job')
      .create('https://youtube.com/watch?v=test123');
    
    expect(job.status).toBe('pending');
    
    // 2. Mock Python service response
    mockPythonService.mockResolvedValueOnce({
      status: 'processing',
      job_id: 'python-job-123'
    });
    
    // 3. Submit to Python
    await strapi.service('plugin::ai-youtube-article.ai-job')
      .submitToPython(job.id);
    
    expect(job.pythonJobId).toBe('python-job-123');
    
    // 4. Poll status (mocked as complete)
    mockPythonService.mockResolvedValueOnce({
      status: 'success',
      data: {
        headline: 'Test Article',
        article: 'Content here',
        summary: 'Summary'
      }
    });
    
    await strapi.service('plugin::ai-youtube-article.ai-job')
      .updateStatus(job.id);
    
    const updatedJob = await strapi.entityService.findOne(
      'plugin::ai-youtube-article.ai-job',
      job.id
    );
    
    expect(updatedJob.status).toBe('completed');
    expect(updatedJob.articleTitle).toBe('Test Article');
    
    // 5. Create article
    const article = await strapi.service('plugin::ai-youtube-article.ai-job')
      .createArticle(job.id);
    
    expect(article.publishedAt).toBeNull();
    expect(article.title).toBe('Test Article');
  });
});
```

## Performance Optimization

### Caching Strategy

```typescript
// server/services/ai-job.ts
const jobCache = new Map<number, { data: any, timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

async function getJobWithCache(jobId: number) {
  const cached = jobCache.get(jobId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const job = await strapi.entityService.findOne(
    'plugin::ai-youtube-article.ai-job',
    jobId
  );
  
  jobCache.set(jobId, { data: job, timestamp: Date.now() });
  
  return job;
}
```

### Batch Processing

```typescript
// server/services/ai-job.ts
async function updateMultipleJobStatuses(jobIds: number[]) {
  const jobs = await strapi.entityService.findMany(
    'plugin::ai-youtube-article.ai-job',
    {
      filters: { id: { $in: jobIds } }
    }
  );
  
  const pythonJobIds = jobs
    .filter(j => j.pythonJobId && j.status === 'processing')
    .map(j => j.pythonJobId);
  
  // Batch request to Python service
  const statuses = await pythonClient.checkMultipleStatuses(pythonJobIds);
  
  // Update all jobs
  const updates = jobs.map((job, i) => ({
    id: job.id,
    data: mapPythonStatusToJob(statuses[i])
  }));
  
  return await Promise.all(
    updates.map(u => strapi.entityService.update(
      'plugin::ai-youtube-article.ai-job',
      u.id,
      { data: u.data }
    ))
  );
}
```

### Database Indexing

```json
// server/content-types/ai-job/schema.json
{
  "options": {
    "indexes": [
      { "name": "status_idx", "columns": ["status"] },
      { "name": "created_at_idx", "columns": ["createdAt"] },
      { "name": "python_job_id_idx", "columns": ["pythonJobId"], "unique": true }
    ]
  }
}
```

## Monitoring & Logging

### Structured Logging

```typescript
// server/services/ai-job.ts
const logger = strapi.log.child({ plugin: 'ai-youtube-article' });

async function create(youtubeUrl: string, user: any) {
  logger.info('Creating new transcription job', {
    youtubeUrl,
    userId: user.id,
    userEmail: user.email
  });
  
  try {
    const job = await strapi.entityService.create(/* ... */);
    
    logger.info('Job created successfully', {
      jobId: job.id,
      youtubeUrl: job.youtubeUrl
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to create job', {
      youtubeUrl,
      userId: user.id,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}
```

### Metrics Collection

```typescript
// server/services/metrics.ts
class JobMetrics {
  private metrics = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0
  };
  
  recordJobCompletion(job: any, success: boolean) {
    this.metrics.totalJobs++;
    
    if (success) {
      this.metrics.successfulJobs++;
    } else {
      this.metrics.failedJobs++;
    }
    
    if (job.completedAt && job.createdAt) {
      const duration = new Date(job.completedAt).getTime() - 
                       new Date(job.createdAt).getTime();
      
      this.metrics.totalProcessingTime += duration;
      this.metrics.averageProcessingTime = 
        this.metrics.totalProcessingTime / this.metrics.successfulJobs;
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalJobs > 0 
        ? (this.metrics.successfulJobs / this.metrics.totalJobs) * 100 
        : 0
    };
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "Python service not responding"

**Cause:** Python FastAPI service is down or unreachable.

**Solution:**
```bash
# Check if Python service is running
curl http://localhost:8000/health

# Restart Python service
cd /path/to/transcriber
uvicorn app:app --reload --port 8000
```

#### 2. "Invalid API key"

**Cause:** `TRANSCRIBER_API_KEY` mismatch between Strapi and Python.

**Solution:**
```bash
# Check Strapi .env
cat .env | grep TRANSCRIBER_API_KEY

# Check Python .env
cd /path/to/transcriber
cat .env | grep API_KEY

# Ensure they match
```

#### 3. "Job stuck in processing"

**Cause:** Python service crashed mid-processing.

**Solution:**
```typescript
// Admin panel → History → Find job → Click "Retry"
// Or via API:
POST /api/ai-youtube-article/jobs/:id/retry
```

#### 4. "Article creation failed"

**Cause:** Required Article fields missing or invalid schema.

**Solution:**
- Check Article content type schema matches expected structure
- Verify `content.paragraph` component exists
- Review error logs for validation failures

#### 5. "Polling not stopping"

**Cause:** Frontend cache not invalidating on completion.

**Solution:**
- Clear browser cache
- Check React Query `refetchInterval` logic
- Verify backend returns correct status

### Debug Mode

Enable detailed logging:

```typescript
// config/plugins.ts
export default {
  'ai-youtube-article': {
    enabled: true,
    config: {
      debug: true, // Enable verbose logging
      pythonServiceUrl: env('TRANSCRIBER_URL'),
      pythonApiKey: env('TRANSCRIBER_API_KEY')
    }
  }
};
```

### Health Check Endpoint

```typescript
// server/controllers/health.ts
async healthCheck(ctx) {
  const pythonHealth = await pythonClient.checkHealth();
  
  return ctx.send({
    status: 'ok',
    plugin: 'ai-youtube-article',
    pythonService: pythonHealth,
    database: await checkDatabaseConnection(),
    timestamp: new Date().toISOString()
  });
}
```

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Python service URL points to production
- [ ] API keys rotated from defaults
- [ ] Database migrations run
- [ ] Admin panel rebuilt (`npm run build`)
- [ ] Permissions configured for roles
- [ ] Health checks passing
- [ ] Logging configured
- [ ] Backup strategy for jobs database
- [ ] Rate limiting enabled
- [ ] HTTPS configured
- [ ] CORS settings updated

### Environment Variables (Production)

```bash
# .env.production
NODE_ENV=production
TRANSCRIBER_URL=https://transcriber.yourapp.com
TRANSCRIBER_API_KEY=prod_secret_key_here
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 1337

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  strapi:
    build: .
    ports:
      - "1337:1337"
    environment:
      - TRANSCRIBER_URL=http://transcriber:8000
      - TRANSCRIBER_API_KEY=${TRANSCRIBER_API_KEY}
    depends_on:
      - postgres
      - transcriber
  
  transcriber:
    image: your-transcriber-image:latest
    ports:
      - "8000:8000"
    environment:
      - API_KEY=${TRANSCRIBER_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=strapi
      - POSTGRES_USER=strapi
      - POSTGRES_PASSWORD=${DB_PASSWORD}
```

## Roadmap

### Phase 1 - MVP ✅
- [x] Basic admin UI
- [x] YouTube URL submission
- [x] Job status tracking
- [x] Article preview
- [x] Draft creation
- [x] Job history

### Phase 2 - Enhancement (Q1 2026)
- [ ] WebSocket real-time updates
- [ ] Bulk video processing
- [ ] Custom AI prompts
- [ ] Cover image generation
- [ ] Category auto-suggestion
- [ ] SEO metadata generation

### Phase 3 - Advanced (Q2 2026)
- [ ] Multi-language support
- [ ] Content Manager integration
- [ ] Scheduled publishing
- [ ] Analytics dashboard
- [ ] Webhook notifications
- [ ] API rate limiting UI

### Phase 4 - Enterprise (Q3 2026)
- [ ] Multi-source support (Vimeo, podcasts)
- [ ] Custom workflow stages
- [ ] Approval workflows
- [ ] Audit logging
- [ ] Export/import jobs
- [ ] Advanced permissions

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code style** (ESLint + Prettier)
4. **Write tests** for new features
5. **Update documentation**
6. **Submit a pull request**

### Code Style

```bash
# Run linter
npm run lint

# Run tests
npm run test

# Type checking
npm run type-check
```

## Support

### Documentation
- [Strapi Plugin Development Guide](https://docs.strapi.io/dev-docs/plugins-development)
- [Strapi Design System](https://design-system.strapi.io/)
- [Python Transcriber API](../../transcriber/README.md)

### Community
- GitHub Issues: [Report bugs](https://github.com/yourorg/repo/issues)
- Discord: [Join our community](#)
- Email: support@yourapp.com

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Changelog

### Version 1.0.0 (2026-01-05)
- Initial release
- YouTube URL submission
- Real-time job tracking
- Article preview and draft creation
- Job history and retry functionality
- Admin settings panel
- Integration with Python transcription service

---

**Made with ❤️ for the Strapi community**
