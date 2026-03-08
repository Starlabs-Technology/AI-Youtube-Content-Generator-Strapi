# API Reference

Complete API documentation for the AI YouTube Article plugin.

---

## Base URL

```
http://localhost:1337/api/ai-youtube-article
```

All endpoints require authentication via Strapi token unless specified otherwise.

---

## Authentication

Include Strapi JWT token in request headers:

```http
Authorization: Bearer YOUR_STRAPI_TOKEN
```

---

## Endpoints

### 1. Create Job

Submit a YouTube URL for transcription and article generation.

**Endpoint:** `POST /jobs`

**Request:**

```http
POST /api/ai-youtube-article/jobs
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "pending",
    "progress": 0,
    "pythonJobId": null,
    "articleTitle": null,
    "articleContent": null,
    "articleSummary": null,
    "errorMessage": null,
    "errorDetails": null,
    "createdArticle": null,
    "metadata": null,
    "completedAt": null,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid URL
{
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Invalid YouTube URL format"
  }
}

// 401 Unauthorized - Missing/invalid token
{
  "error": {
    "status": 401,
    "name": "UnauthorizedError",
    "message": "Invalid credentials"
  }
}

// 500 Internal Server Error
{
  "error": {
    "status": 500,
    "name": "InternalServerError",
    "message": "Failed to create transcription job"
  }
}
```

---

### 2. Get Job Status

Retrieve current status of a transcription job. This endpoint automatically polls the Python service for updates.

**Endpoint:** `GET /jobs/:id`

**Request:**

```http
GET /api/ai-youtube-article/jobs/1
Authorization: Bearer YOUR_TOKEN
```

> Note: The admin UI normalizes job payloads received from the server so the modal can read canonical fields.
> The UI uses these canonical fields internally: `articleTitle`, `articleContent`, `articleSummary`.
> When integrating external services that post callbacks or update jobs, ensure those callbacks populate either the legacy fields (`articleTitle`, `articleContent`, `articleSummary`) or the newer canonical fields (`title`, `excerpt`, `body`) — the UI will prefer legacy field names but falls back to the new ones automatically.

---

### 3. List Jobs (with pagination)

Retrieve a paginated list of transcription jobs. Supports filtering and pagination parameters.

**Endpoint:** `GET /jobs`

**Query parameters:**
- `pagination[page]` (number) — page number (default: 1)
- `pagination[pageSize]` (number) — page size (default: 25, max: 100)
- `status` — filter by job status (`pending|processing|completed|failed`)
- `_sort` — sort string (e.g. `createdAt:desc`)

**Example:**

```http
GET /api/ai-youtube-article/jobs?pagination[page]=1&pagination[pageSize]=25&status=completed&_sort=createdAt:desc
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "data": [ /* array of jobs */ ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 4,
      "total": 95
    }
  }
}
```

> Note: Requests previously used `_start`/`_limit` or `_limit=-1` to fetch all; the service now caps page sizes to a maximum (100) to protect production workloads.


**Response:** `200 OK`

**When processing:**

```json
{
  "data": {
    "id": 1,
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "processing",
    "progress": 45,
    "pythonJobId": "550e8400-e29b-41d4-a716-446655440000",
    "articleTitle": null,
    "articleContent": null,
    "articleSummary": null,
    "errorMessage": null,
    "errorDetails": null,
    "createdArticle": null,
    "metadata": null,
    "completedAt": null,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:02:30.000Z"
  }
}
```

**When completed:**

```json
{
  "data": {
    "id": 1,
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "completed",
    "progress": 100,
    "pythonJobId": "550e8400-e29b-41d4-a716-446655440000",
    "articleTitle": "Rick Astley Never Gives Up on Music",
    "articleContent": "Paragraph 1 content...\n\nParagraph 2 content...",
    "articleSummary": "• Key point 1\n• Key point 2\n• Key point 3",
    "errorMessage": null,
    "errorDetails": null,
    "createdArticle": null,
    "metadata": {
      "duration_seconds": 212,
      "language": "en",
      "processing_time_seconds": 45
    },
    "completedAt": "2026-01-05T10:03:00.000Z",
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:03:00.000Z"
  }
}
```

**When failed:**

```json
{
  "data": {
    "id": 1,
    "youtubeUrl": "https://youtube.com/watch?v=INVALID",
    "status": "failed",
    "progress": 20,
    "pythonJobId": "550e8400-e29b-41d4-a716-446655440000",
    "articleTitle": null,
    "articleContent": null,
    "articleSummary": null,
    "errorMessage": "Failed to download YouTube video",
    "errorDetails": [
      {
        "stage": "audio_extraction",
        "message": "Video unavailable or private",
        "timestamp": "2026-01-05T10:01:30.000Z"
      }
    ],
    "createdArticle": null,
    "metadata": null,
    "completedAt": null,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:01:30.000Z"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Job not found"
  }
}
```

---

### 3. List Jobs

Retrieve all transcription jobs with optional filtering and pagination.

**Endpoint:** `GET /jobs`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status: `pending`, `processing`, `completed`, `failed` |
| `_limit` | number | 25 | Number of results per page |
| `_start` | number | 0 | Offset for pagination |
| `_sort` | string | `createdAt:desc` | Sort field and order |

**Request:**

```http
GET /api/ai-youtube-article/jobs?status=completed&_limit=10&_sort=completedAt:desc
Authorization: Bearer YOUR_TOKEN
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 3,
      "youtubeUrl": "https://youtube.com/watch?v=example3",
      "status": "completed",
      "progress": 100,
      "pythonJobId": "uuid-3",
      "articleTitle": "Article Title 3",
      "articleContent": "Content...",
      "articleSummary": "Summary...",
      "createdArticle": {
        "id": 42,
        "title": "Article Title 3"
      },
      "metadata": {
        "duration_seconds": 180,
        "language": "en"
      },
      "completedAt": "2026-01-05T09:30:00.000Z",
      "createdAt": "2026-01-05T09:25:00.000Z",
      "updatedAt": "2026-01-05T09:30:00.000Z"
    },
    {
      "id": 2,
      "youtubeUrl": "https://youtube.com/watch?v=example2",
      "status": "completed",
      "progress": 100,
      "pythonJobId": "uuid-2",
      "articleTitle": "Article Title 2",
      "articleContent": "Content...",
      "articleSummary": "Summary...",
      "createdArticle": null,
      "metadata": {
        "duration_seconds": 240,
        "language": "en"
      },
      "completedAt": "2026-01-05T09:15:00.000Z",
      "createdAt": "2026-01-05T09:10:00.000Z",
      "updatedAt": "2026-01-05T09:15:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

---

### 4. Create Draft Article

Create a draft article in Strapi from a completed job.

**Endpoint:** `POST /jobs/:id/create-article`

**Request:**

```http
POST /api/ai-youtube-article/jobs/1/create-article
Authorization: Bearer YOUR_TOKEN
```

**Response:** `201 Created`

```json
{
  "data": {
    "articleId": 42,
    "jobId": 1,
    "message": "Draft article created successfully"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Job not completed
{
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Job must be completed before creating article"
  }
}

// 409 Conflict - Article already exists
{
  "error": {
    "status": 409,
    "name": "ConflictError",
    "message": "Article already created for this job"
  }
}

// 404 Not Found
{
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Job 1 not found"
  }
}
```

---

### 5. Retry Failed Job

Retry a failed transcription job.

**Endpoint:** `POST /jobs/:id/retry`

**Request:**

```http
POST /api/ai-youtube-article/jobs/1/retry
Authorization: Bearer YOUR_TOKEN
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "pending",
    "progress": 0,
    "pythonJobId": null,
    "errorMessage": null,
    "errorDetails": null,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-01-05T10:10:00.000Z"
  },
  "message": "Job retry initiated"
}
```

**Error Responses:**

```json
// 400 Bad Request - Job not failed
{
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Only failed jobs can be retried"
  }
}

// 404 Not Found
{
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Job 1 not found"
  }
}
```

---

### 6. Delete Job

Delete a transcription job and optionally its associated article.

**Endpoint:** `DELETE /jobs/:id`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `deleteArticle` | boolean | false | Also delete the created article |

**Request:**

```http
DELETE /api/ai-youtube-article/jobs/1?deleteArticle=true
Authorization: Bearer YOUR_TOKEN
```

**Response:** `200 OK`

```json
{
  "message": "Job deleted successfully"
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Job 1 not found"
  }
}
```

---

### 7. Health Check

Check plugin and Python service health (no authentication required).

**Endpoint:** `GET /health`

**Request:**

```http
GET /api/ai-youtube-article/health
```

**Response:** `200 OK`

```json
{
  "status": "ok",
  "plugin": "ai-youtube-article",
  "pythonService": {
    "status": "healthy",
    "message": "Service is running"
  },
  "timestamp": "2026-01-05T10:00:00.000Z"
}
```

**When Python service is down:**

```json
{
  "status": "error",
  "plugin": "ai-youtube-article",
  "pythonService": {
    "status": "error",
    "message": "Python service unreachable"
  },
  "timestamp": "2026-01-05T10:00:00.000Z"
}
```

---

## Data Models

### Job Object

```typescript
interface Job {
  id: number;
  youtubeUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  pythonJobId: string | null;
  articleTitle: string | null;
  articleContent: string | null;
  articleSummary: string | null;
  errorMessage: string | null;
  errorDetails: ErrorDetail[] | null;
  createdArticle: Article | null;
  metadata: JobMetadata | null;
  completedAt: string | null; // ISO 8601 datetime
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}
```

### Job Metadata

```typescript
interface JobMetadata {
  duration_seconds: number;
  language: string; // ISO 639-1 code (e.g., "en", "es")
  processing_time_seconds: number;
}
```

### Error Detail

```typescript
interface ErrorDetail {
  stage: 'audio_extraction' | 'transcription' | 'rag_context' | 'ai_generation' | 'strapi_push';
  message: string;
  timestamp: string; // ISO 8601 datetime
}
```

### Article Reference

```typescript
interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null; // null = draft
}
```

---

## Status Flow

```
pending → processing → completed
   ↓                       ↓
failed  ←──────────────────┘
   ↓
pending (after retry)
```

### Status Descriptions

| Status | Description | Can Transition To |
|--------|-------------|-------------------|
| `pending` | Job created, waiting for Python service | `processing`, `failed` |
| `processing` | Actively transcribing/generating | `completed`, `failed` |
| `completed` | Successfully generated article | - |
| `failed` | Error occurred | `pending` (via retry) |

---

## Rate Limiting

The plugin does not impose rate limits by default, but you can implement custom rate limiting:

**Example Implementation:**

```typescript
// server/middlewares/rate-limit.ts
export default async (ctx, next) => {
  const userId = ctx.state.user?.id;
  
  if (!userId) {
    return ctx.unauthorized('Authentication required');
  }
  
  // Check recent job count
  const recentJobs = await strapi.entityService.findMany(
    'plugin::ai-youtube-article.ai-job',
    {
      filters: {
        createdBy: userId,
        createdAt: { $gt: new Date(Date.now() - 3600000) } // Last hour
      }
    }
  );
  
  if (recentJobs.length >= 10) {
    return ctx.tooManyRequests('Rate limit exceeded. Maximum 10 jobs per hour.');
  }
  
  await next();
};
```

---

## Webhook Integration (Future)

For real-time updates, you can configure webhooks:

**Configuration:**

```typescript
// config/plugins.ts
export default {
  'ai-youtube-article': {
    enabled: true,
    config: {
      pythonServiceUrl: env('TRANSCRIBER_URL'),
      pythonApiKey: env('TRANSCRIBER_API_KEY'),
      webhookUrl: env('PLUGIN_WEBHOOK_URL'), // Your callback URL
    }
  }
};
```

**Webhook Payload:**

```json
{
  "event": "job.completed",
  "jobId": 1,
  "pythonJobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "data": {
    "articleTitle": "Article Title",
    "articleContent": "Content...",
    "articleSummary": "Summary..."
  },
  "timestamp": "2026-01-05T10:00:00.000Z"
}
```

---

## Client Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:1337/api/ai-youtube-article';
const TOKEN = 'your_strapi_token';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Create job
async function createJob(youtubeUrl: string) {
  const response = await client.post('/jobs', { youtubeUrl });
  return response.data.data;
}

// Poll job status
async function pollJobStatus(jobId: number): Promise<Job> {
  const response = await client.get(`/jobs/${jobId}`);
  const job = response.data.data;
  
  if (job.status === 'processing' || job.status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    return pollJobStatus(jobId); // Recursive poll
  }
  
  return job;
}

// Create article
async function createArticle(jobId: number) {
  const response = await client.post(`/jobs/${jobId}/create-article`);
  return response.data.data;
}

// Complete workflow
async function processYouTubeVideo(url: string) {
  // 1. Create job
  const job = await createJob(url);
  console.log('Job created:', job.id);
  
  // 2. Poll until complete
  const completedJob = await pollJobStatus(job.id);
  
  if (completedJob.status === 'failed') {
    throw new Error(completedJob.errorMessage);
  }
  
  console.log('Transcription complete:', completedJob.articleTitle);
  
  // 3. Create draft article
  const article = await createArticle(completedJob.id);
  console.log('Article created:', article.articleId);
  
  return article;
}
```

### React Hook

```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_BASE = 'http://localhost:1337/api/ai-youtube-article';

// Get auth token from Strapi context
const getToken = () => localStorage.getItem('jwtToken');

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create job mutation
export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (youtubeUrl: string) => client.post('/jobs', { youtubeUrl }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
      }
    }
  );
}

// Job status query with auto-polling
export function useJobStatus(jobId: number) {
  return useQuery(
    ['job', jobId],
    () => client.get(`/jobs/${jobId}`).then(res => res.data.data),
    {
      refetchInterval: (data) => {
        // Stop polling when complete or failed
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 5000; // Poll every 5 seconds
      },
      enabled: !!jobId
    }
  );
}

// Create article mutation
export function useCreateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (jobId: number) => client.post(`/jobs/${jobId}/create-article`),
    {
      onSuccess: (_, jobId) => {
        queryClient.invalidateQueries(['job', jobId]);
        queryClient.invalidateQueries('jobs');
      }
    }
  );
}

// List jobs query
export function useJobs(filters?: { status?: string }) {
  return useQuery(
    ['jobs', filters],
    () => client.get('/jobs', { params: filters }).then(res => res.data)
  );
}
```

---

## Error Codes

| HTTP Status | Error Name | Description |
|-------------|------------|-------------|
| 400 | BadRequestError | Invalid request data |
| 401 | UnauthorizedError | Missing or invalid authentication |
| 403 | ForbiddenError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 409 | ConflictError | Resource conflict (e.g., article already exists) |
| 429 | TooManyRequestsError | Rate limit exceeded |
| 500 | InternalServerError | Server error |

---

## Best Practices

1. **Polling Frequency**: Poll job status every 5-10 seconds. Avoid excessive requests.

2. **Error Handling**: Always handle failed status and retry logic.

3. **Draft Review**: Never auto-publish articles. Always create drafts for editorial review.

4. **URL Validation**: Validate YouTube URLs client-side before submission.

5. **Timeout Handling**: Set reasonable timeouts for long-running operations.

6. **Batch Operations**: If processing multiple videos, stagger submissions to avoid overwhelming services.

7. **Token Security**: Never expose Strapi tokens in client-side code. Use server-side proxies.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-05 | Initial release |

---

**For support, visit the [GitHub repository](https://github.com/yourorg/repo) or contact support@yourapp.com**
