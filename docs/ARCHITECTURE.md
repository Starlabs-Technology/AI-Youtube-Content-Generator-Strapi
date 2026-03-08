# Architecture Overview

This document provides a comprehensive architectural overview of the AI YouTube Article plugin, including design decisions, data flow, and system interactions.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Overview](#component-overview)
3. [Data Flow](#data-flow)
4. [Integration Patterns](#integration-patterns)
5. [State Management](#state-management)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Security Architecture](#security-architecture)
9. [Scalability Design](#scalability-design)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Editor)                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Strapi Admin Panel (React)                       │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │     AI YouTube Article Plugin UI                        │  │  │
│  │  │  • Submit Form                                           │  │  │
│  │  │  • Status Monitor (React Query polling)                 │  │  │
│  │  │  • Article Preview                                       │  │  │
│  │  │  • History Dashboard                                     │  │  │
│  │  │  • Settings Panel                                        │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────┬─────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────┘
                             │ HTTP/REST (JWT Auth)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Strapi Server (Node.js)                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           Plugin Backend (TypeScript)                         │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐  │  │
│  │  │  Controllers    │  │    Services      │  │   Routes    │  │  │
│  │  │  • create()     │→ │  • createJob()   │  │  POST /jobs │  │  │
│  │  │  • findOne()    │→ │  • updateStatus()│  │  GET /jobs  │  │  │
│  │  │  • find()       │→ │  • createArticle│  │  ...        │  │  │
│  │  │  • retry()      │  │  • retryJob()    │  │             │  │  │
│  │  └─────────────────┘  └──────────────────┘  └─────────────┘  │  │
│  │                             │                                  │  │
│  │                             ▼                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │           Python Client Service                          │  │  │
│  │  │  • HTTP client with retry logic                          │  │  │
│  │  │  • Request/response transformation                       │  │  │
│  │  │  • Error handling                                        │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                             │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           Content Type: ai-job (SQLite/PostgreSQL)           │  │
│  │  • Job persistence                                            │  │
│  │  • Status tracking                                            │  │
│  │  • Article relation                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                             │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           Content Type: article (Core API)                   │  │
│  │  • Draft article creation                                     │  │
│  │  • Dynamic zone content blocks                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP/REST (API Key Auth)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Python FastAPI Service (Transcriber)                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Processing Pipeline                        │  │
│  │  Stage 1: Audio Extraction (yt-dlp, moviepy)                 │  │
│  │           ↓                                                   │  │
│  │  Stage 2: Transcription (OpenAI Whisper)                     │  │
│  │           ↓                                                   │  │
│  │  Stage 3: RAG Context (FAISS, SentenceTransformer)           │  │
│  │           ↓                                                   │  │
│  │  Stage 4: AI Generation (Google Gemini 2.5 Flash)            │  │
│  │           ↓                                                   │  │
│  │  Stage 5: Response Formatting                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           In-Memory Job Store (Dict)                         │  │
│  │  • Job status tracking                                        │  │
│  │  • Progress updates                                           │  │
│  │  • Error collection                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Overview

### Frontend Components (React)

#### 1. Plugin Entry Point
- **Location:** `admin/src/index.tsx`
- **Responsibility:** Register plugin, define routes, configure navigation
- **Key Features:**
  - Admin panel integration
  - Route configuration
  - Permission hooks

#### 2. Home Page
- **Location:** `admin/src/pages/Home/index.tsx`
- **Responsibility:** Main submission interface
- **Key Features:**
  - YouTube URL form with validation
  - Real-time job status display
  - Article preview component
  - "Create Draft" action button
  - Error display and retry mechanism

#### 3. History Page
- **Location:** `admin/src/pages/History/index.tsx`
- **Responsibility:** Job history and management
- **Key Features:**
  - Paginated job table
  - Status filtering
  - Bulk operations
  - Navigate to related articles

#### 4. Settings Page
- **Location:** `admin/src/pages/Settings/index.tsx`
- **Responsibility:** Plugin configuration
- **Key Features:**
  - Python service URL configuration
  - API key management
  - Polling interval settings
  - Health check display

#### 5. Shared Components
- **UrlForm:** YouTube URL input with validation
- **JobStatus:** Status badge and progress indicator
- **ArticlePreview:** Rich text preview of generated content
- **JobTable:** Reusable data table with sorting/filtering

### Backend Components (Node.js/TypeScript)

#### 1. Controllers Layer
- **Location:** `server/controllers/ai-job.ts`
- **Responsibility:** HTTP request handling
- **Methods:**
  - `create`: Create new job
  - `findOne`: Get job by ID
  - `find`: List jobs with filters
  - `createArticle`: Generate draft article
  - `retry`: Retry failed job
  - `delete`: Delete job
  - `health`: Service health check

#### 2. Services Layer
- **Location:** `server/services/ai-job.ts`
- **Responsibility:** Business logic
- **Methods:**
  - `createJob`: Initialize job record
  - `submitToPython`: Send to transcription service
  - `updateJobStatus`: Poll and sync status
  - `createArticleFromJob`: Transform to Strapi article
  - `retryJob`: Reset and resubmit
  - `deleteJob`: Clean up resources

#### 3. Python Client
- **Location:** `server/services/python-client.ts`
- **Responsibility:** External API integration
- **Features:**
  - HTTP client with timeout/retry
  - Request/response transformation
  - Error mapping
  - Health check

#### 4. Content Types
- **ai-job:** Custom plugin content type
  - Tracks all job state
  - Relations to articles
  - Error logging
  
- **article:** Core Strapi content type (extended)
  - Dynamic zone for content blocks
  - `aiTranscription` field for full text
  - Draft mode via `publishedAt`

---

## Data Flow

### Complete Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. JOB SUBMISSION                                                   │
└─────────────────────────────────────────────────────────────────────┘

Editor (UI)
  ↓ [Submits YouTube URL]
  ↓
Controller.create()
  ↓ [Validates URL format]
  ↓
Service.createJob()
  ↓ [Creates ai-job record with status="pending"]
  ↓
Database
  ← [Returns job object with ID]
  ←
Service.submitToPython() [async, non-blocking]
  ↓ [POST /api/generate-article]
  ↓
Python Service
  ← [Returns { job_id: "uuid", status: "processing" }]
  ←
Service.createJob()
  ↓ [Updates ai-job with pythonJobId, status="processing"]
  ↓
Response to Editor
  ← [{ data: { id: 1, status: "pending", ... } }]


┌─────────────────────────────────────────────────────────────────────┐
│ 2. STATUS POLLING (Repeats every 5 seconds)                         │
└─────────────────────────────────────────────────────────────────────┘

Editor (UI - React Query)
  ↓ [Auto-polls every 5s]
  ↓
Controller.findOne(id)
  ↓
Service.updateJobStatus(id)
  ↓ [Reads ai-job from DB]
  ↓
Database
  ← [Returns job with pythonJobId]
  ←
Service.updateJobStatus()
  ↓ [GET /api/status/{pythonJobId}]
  ↓
Python Service
  ← [Returns { status: "processing", progress: 60, stage: "rag_context" }]
  ←
Service.updateJobStatus()
  ↓ [Updates ai-job: progress=60]
  ↓
Response to Editor
  ← [{ data: { id: 1, status: "processing", progress: 60, ... } }]


┌─────────────────────────────────────────────────────────────────────┐
│ 3. COMPLETION                                                       │
└─────────────────────────────────────────────────────────────────────┘

[After ~2-5 minutes, Python completes processing]

Editor (UI)
  ↓ [Polls again]
  ↓
Controller.findOne(id)
  ↓
Service.updateJobStatus(id)
  ↓ [GET /api/status/{pythonJobId}]
  ↓
Python Service
  ← [Returns {
       status: "success",
       data: {
         headline: "Article Title",
         summary: "• Point 1\n• Point 2",
         article: "Full article text...",
         metadata: { duration_seconds: 180, language: "en" }
       }
     }]
  ←
Service.updateJobStatus()
  ↓ [Updates ai-job:
      status="completed",
      articleTitle="Article Title",
      articleContent="Full article text...",
      articleSummary="• Point 1\n• Point 2",
      metadata={...},
      completedAt=now()]
  ↓
Response to Editor
  ← [{ data: { id: 1, status: "completed", articleTitle: "...", ... } }]
  ←
Editor UI
  ↓ [Stops polling (status === "completed")]
  ↓ [Shows article preview]
  ↓ [Enables "Create Draft Article" button]


┌─────────────────────────────────────────────────────────────────────┐
│ 4. ARTICLE CREATION                                                 │
└─────────────────────────────────────────────────────────────────────┘

Editor (UI)
  ↓ [Clicks "Create Draft Article"]
  ↓
Controller.createArticle(id)
  ↓
Service.createArticleFromJob(id)
  ↓ [Reads ai-job from DB]
  ↓ [Validates status === "completed"]
  ↓ [Splits articleContent by \n\n into paragraphs]
  ↓ [Creates content blocks: [{ __component: "content.paragraph", content: "..." }]]
  ↓
Strapi EntityService
  ↓ [Creates api::article.article with:
      title, slug, excerpt, content blocks, aiTranscription,
      publishedAt=null (DRAFT)]
  ↓
Database
  ← [Returns article object with ID]
  ←
Service.createArticleFromJob()
  ↓ [Updates ai-job: createdArticle=article.id]
  ↓
Response to Editor
  ← [{ data: { articleId: 42, jobId: 1, message: "..." } }]
  ←
Editor UI
  ↓ [Redirects to /admin/content-manager/article/42]
  ↓ [Editor can now review, edit, set category/author, publish]
```

---

## Integration Patterns

### Pattern 1: Async Job Processing

**Problem:** YouTube transcription takes 2-5 minutes. Can't block HTTP request.

**Solution:** 
1. Create job record immediately
2. Return job ID to client
3. Submit to Python service asynchronously
4. Client polls for updates

**Benefits:**
- Responsive UI
- Fault tolerance
- Progress tracking

### Pattern 2: Status Polling vs Webhooks

**Current Implementation:** Polling (every 5 seconds)

**Why Polling?**
- Simple to implement
- No network configuration needed
- Works behind firewalls
- Already implemented in Python service

**Future: Webhooks**
```typescript
// Python service would call:
POST https://strapi.com/api/ai-youtube-article/webhooks/job-update
{
  "pythonJobId": "uuid",
  "status": "completed",
  "data": { ... }
}

// Strapi endpoint:
async webhookUpdate(ctx) {
  const { pythonJobId, status, data } = ctx.request.body;
  
  // Find job by pythonJobId
  const job = await strapi.entityService.findMany(
    'plugin::ai-youtube-article.ai-job',
    { filters: { pythonJobId } }
  );
  
  // Update immediately (no polling needed)
  await strapi.entityService.update(
    'plugin::ai-youtube-article.ai-job',
    job[0].id,
    { data: mapPythonStatus(status, data) }
  );
}
```

**Benefits of Webhooks:**
- Real-time updates
- Reduced server load
- No polling overhead

### Pattern 3: Draft-First Publishing

**Problem:** Auto-publishing AI content bypasses editorial review.

**Solution:**
- Always set `publishedAt: null` when creating articles
- Editors review in Content Manager
- Manual publish action required

**Implementation:**
```typescript
const article = await strapi.entityService.create(
  'api::article.article',
  {
    data: {
      // ... generated content
      publishedAt: null, // DRAFT
    }
  }
);
```

### Pattern 4: Dynamic Zone Content Blocks

**Problem:** Article content needs to be structured, not plain text.

**Solution:**
- Split generated text by `\n\n` (paragraphs)
- Map each paragraph to `content.paragraph` component
- Store full text in `aiTranscription` field as backup

**Implementation:**
```typescript
const paragraphs = job.articleContent.split('\n\n').filter(p => p.trim());
const contentBlocks = paragraphs.map(para => ({
  __component: 'content.paragraph',
  content: para
}));
```

**Benefits:**
- Structured content
- Editable in Content Manager
- Supports rich formatting
- Preserves original transcript

---

## State Management

### Frontend State (React Query)

```typescript
// Job status cache
queryClient.setQueryData(['job', jobId], jobData);

// Automatic cache invalidation
queryClient.invalidateQueries(['job', jobId]);

// Optimistic updates
queryClient.setQueryData(['job', jobId], (old) => ({
  ...old,
  status: 'processing'
}));
```

**Benefits:**
- Automatic refetching
- Cache management
- Optimistic UI updates
- Background synchronization

### Backend State

**Persistent State (Database):**
- All jobs stored in `ai_jobs` table
- Survives server restarts
- Supports queries and filtering

**Transient State (Python Service):**
- In-memory job tracking
- Lost on Python service restart
- Strapi can detect and mark as failed

**State Synchronization:**
```typescript
// Detect orphaned jobs (Python restarted)
async function detectOrphanedJobs() {
  const processingJobs = await strapi.entityService.findMany(
    'plugin::ai-youtube-article.ai-job',
    { filters: { status: 'processing' } }
  );
  
  for (const job of processingJobs) {
    try {
      await pythonClient.checkStatus(job.pythonJobId);
    } catch (error) {
      if (error.message.includes('not found')) {
        // Mark as failed - Python service lost this job
        await strapi.entityService.update(
          'plugin::ai-youtube-article.ai-job',
          job.id,
          {
            data: {
              status: 'failed',
              errorMessage: 'Job lost due to service restart'
            }
          }
        );
      }
    }
  }
}
```

---

## Error Handling Strategy

### Multi-Layer Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: UI Error Display                                       │
│  • User-friendly error messages                                 │
│  • Retry buttons                                                │
│  • Toast notifications                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Controller Error Responses                             │
│  • HTTP status codes (400, 404, 500)                            │
│  • Structured error objects                                     │
│  • Logging                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Service Error Handling                                 │
│  • Try-catch blocks                                             │
│  • Error transformation                                         │
│  • Job status updates                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Python Client Error Handling                           │
│  • Axios error handling                                         │
│  • Timeout management                                           │
│  • Retry logic (exponential backoff)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: Python Service Error Handling                          │
│  • Stage-level error capture                                    │
│  • Detailed error objects                                       │
│  • Error storage in job state                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Error Types and Recovery

| Error Type | Layer | Recovery Strategy |
|------------|-------|-------------------|
| Invalid YouTube URL | Controller | Reject immediately, show validation error |
| Python service down | Python Client | Retry with exponential backoff, mark failed after 3 attempts |
| Transcription failed | Python Service | Store detailed error, allow manual retry |
| Article creation failed | Service | Preserve job data, allow retry without re-transcription |
| Network timeout | Python Client | Retry request, update job progress |
| Database error | EntityService | Log error, return 500, preserve state if possible |

---

## Performance Considerations

### 1. Database Indexing

```sql
-- Indexes for fast queries
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_created_at ON ai_jobs(created_at);
CREATE INDEX idx_ai_jobs_python_job_id ON ai_jobs(python_job_id);
CREATE INDEX idx_ai_jobs_created_by ON ai_jobs(created_by);
```

### 2. Query Optimization

```typescript
// Use pagination
const jobs = await strapi.entityService.findMany(
  'plugin::ai-youtube-article.ai-job',
  {
    start: 0,
    limit: 25,
    populate: ['createdArticle'], // Only populate needed relations
  }
);

// Use filters to reduce data
const activeJobs = await strapi.entityService.findMany(
  'plugin::ai-youtube-article.ai-job',
  {
    filters: {
      status: { $in: ['pending', 'processing'] }
    }
  }
);
```

### 3. Frontend Optimizations

```typescript
// React Query caching
const { data } = useQuery(
  ['job', jobId],
  () => fetchJob(jobId),
  {
    staleTime: 5000, // Consider data fresh for 5s
    cacheTime: 300000, // Keep in cache for 5 minutes
  }
);

// Debounce polling
refetchInterval: (data) => {
  if (data?.status === 'completed') return false;
  return 5000; // Only poll active jobs
}
```

### 4. Python Service Optimizations

- **Model Caching:** Whisper model loaded once at startup
- **Async Processing:** Non-blocking job execution
- **Batch Embeddings:** Process transcript chunks together
- **Rate Limiting:** 2-second delays between Gemini API calls

---

## Security Architecture

### 1. Authentication Flow

```
User → Strapi Admin Login → JWT Token → Plugin API Requests
                                ↓
                          Validated by Strapi
                                ↓
                        ctx.state.user populated
                                ↓
                        Permission checks
                                ↓
                        Execute action
```

### 2. API Key Security

```typescript
// Never expose in frontend
const config = strapi.config.get('plugin.ai-youtube-article');
const pythonApiKey = config.pythonApiKey; // Server-side only

// Stored in environment variables
TRANSCRIBER_API_KEY=supersecret
```

### 3. Input Validation

```typescript
// URL validation
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
if (!youtubeRegex.test(youtubeUrl)) {
  return ctx.badRequest('Invalid YouTube URL');
}

// Sanitize generated content
const sanitized = DOMPurify.sanitize(job.articleContent);
```

### 4. Permission Model

```typescript
// settings/actions
{
  "permissions": [
    {
      "action": "plugin::ai-youtube-article.job.create",
      "subject": null,
      "properties": {},
      "conditions": []
    },
    {
      "action": "plugin::ai-youtube-article.job.read",
      "subject": null,
      "properties": {},
      "conditions": ["isOwner"] // Only see own jobs
    },
    {
      "action": "plugin::ai-youtube-article.job.delete",
      "subject": null,
      "properties": {},
      "conditions": ["isAdmin"] // Admin only
    }
  ]
}
```

---

## Scalability Design

### Current Limitations

- **Sequential Processing:** One job at a time in Python service
- **In-Memory State:** Python job state lost on restart
- **Polling Overhead:** Multiple clients polling same endpoint

### Scalability Improvements

#### 1. Job Queue (Bull/BullMQ)

```typescript
import Queue from 'bull';

const transcriptionQueue = new Queue('transcription', {
  redis: { host: 'localhost', port: 6379 }
});

// Producer (Strapi)
await transcriptionQueue.add({
  jobId: job.id,
  youtubeUrl: job.youtubeUrl
});

// Consumer (Python or separate Node worker)
transcriptionQueue.process(async (job) => {
  const result = await pythonClient.generateArticle(job.data.youtubeUrl);
  return result;
});
```

**Benefits:**
- Concurrent processing
- Priority queues
- Retry logic
- Progress tracking
- Distributed workers

#### 2. Webhook-Based Updates

Replace polling with webhooks for real-time updates (see Integration Patterns).

#### 3. Horizontal Scaling

```yaml
# docker-compose.yml
services:
  strapi:
    replicas: 3
    
  python-transcriber:
    replicas: 2
    
  redis:
    image: redis:alpine
    
  postgres:
    image: postgres:15
```

#### 4. Caching Layer

```typescript
import Redis from 'ioredis';

const redis = new Redis();

// Cache job status
await redis.setex(`job:${jobId}`, 5, JSON.stringify(job));

// Read from cache
const cached = await redis.get(`job:${jobId}`);
if (cached) return JSON.parse(cached);
```

---

## Design Decisions

### Why Not Use Content Manager for Submission?

**Decision:** Create standalone plugin UI instead of integrating with Content Manager.

**Reasoning:**
- Avoids schema validation during async processing
- Provides dedicated workflow interface
- Separates AI generation from editorial process
- Allows richer status tracking UI

### Why Store Full Text in `aiTranscription`?

**Decision:** Store complete article text in dedicated field, separate from dynamic zone blocks.

**Reasoning:**
- Backup of original generated content
- Allows regenerating blocks if needed
- Searchable full-text index
- Audit trail of AI output

### Why Draft-Only Creation?

**Decision:** Never auto-publish, always create drafts.

**Reasoning:**
- Editorial review required for AI content
- Prevents accidental publication
- Allows category/author assignment
- Maintains content quality standards

---

## Future Enhancements

### Phase 2 (Q1 2026)
- WebSocket real-time updates
- Bulk video processing
- Custom AI prompts
- Cover image generation from video thumbnail

### Phase 3 (Q2 2026)
- Multi-language support
- Content Manager integration (context menu)
- Scheduled publishing
- Analytics dashboard

### Phase 4 (Q3 2026)
- Multi-source support (Vimeo, podcasts, PDFs)
- Custom workflow stages (approval chains)
- Advanced permissions (department-level access)
- Export/import jobs

---

**This architecture provides a solid foundation for scalable, maintainable AI content generation within Strapi.**
