# AI YouTube Article — Strapi v5 Plugin

> Turn any YouTube video into a fully-written, publish-ready article in seconds — right from the Strapi admin panel.

![Strapi v5](https://img.shields.io/badge/Strapi-v5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## 🚀 What Is This?

**AI YouTube Article** is a Strapi v5 plugin that takes a YouTube video URL and automatically generates a complete, structured blog article from it. It works by:

1. **Extracting the transcript** from the YouTube video via [Apify](https://apify.com) (a cloud scraping platform)
2. **Sending the transcript to Google Gemini AI**, which writes a professional article complete with a headline, summary, body content (with headings), and tags
3. **Saving everything** as a trackable job inside your Strapi admin panel

No copy-pasting transcripts. No switching between tools. Just paste a URL and get an article.

---

## 🎯 Problems It Solves

| Problem | How This Plugin Solves It |
|---|---|
| Manually transcribing YouTube videos is tedious | Apify automatically scrapes captions/subtitles |
| Writing articles from video content takes hours | Gemini AI generates a full article in under a minute |
| No way to track content generation progress | Built-in job dashboard with real-time progress bars |
| Content teams need a streamlined workflow | Everything lives inside the Strapi admin — submit, track, review, publish |
| Failed jobs waste time | One-click retry and refresh for any failed job |
| Hard to manage generated content | Full job history with search, filtering, and detail modals |

---

## ✨ Features

- 🎬 **One-click article generation** — paste a YouTube URL, get a full article
- 📝 **Apify transcript scraping** — extracts captions from any YouTube video with subtitles
- 🤖 **Google Gemini AI writing** — generates structured articles with headline, summary, subheadings, and body text
- 📊 **Real-time job tracking** — progress bar updates as the job moves through each stage (5% → 15% → 45% → 55% → 100%)
- 📋 **Job history page** — searchable, filterable table of all past jobs with status badges
- 🔍 **Job detail modal** — click any job to see full details, metadata, transcript info, and generated article
- 📰 **Article preview** — rendered Markdown preview of the generated article before publishing
- ✏️ **Create draft article** — one click to turn a completed job into a Strapi Article content entry (draft)
- 🔄 **Retry / refresh** — re-run failed jobs or refresh status of in-progress ones
- 🗑️ **Delete jobs** — clean up old or unwanted jobs
- ⚙️ **Settings page** — configure API keys, model, and polling interval from the admin UI
- 🔌 **Test Connection** — verify Apify and Gemini credentials are working before submitting jobs
- 🏥 **Health endpoint** — `/ai-youtube-article/health` for monitoring
- 🛡️ **Secure** — all admin routes require authentication, API keys stored server-side

---

## 🔧 How It Works (Pipeline)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  User pastes │     │  Apify scrapes   │     │  Gemini AI       │     │  Article     │
│  YouTube URL │ ──► │  video captions  │ ──► │  writes article  │ ──► │  saved to    │
│  in Strapi   │     │  (cloud actor)   │     │  from transcript │     │  Strapi DB   │
└──────────────┘     └──────────────────┘     └──────────────────┘     └──────────────┘
      5%                    15-45%                   55-100%               ✅ Complete
```

**Detailed steps:**

1. **Job Created (5%)** — User submits a YouTube URL, a job record is created in the database
2. **Transcript Fetch (15-45%)** — The Apify actor starts, scrapes the video's captions, and returns the transcript text
3. **Article Generation (55-100%)** — The transcript + video metadata is sent to Google Gemini with a detailed prompt. Gemini returns structured JSON with a headline, summary, full Markdown article, and tags
4. **Complete (100%)** — The generated article is saved to the job record. The user can preview it and optionally create a Strapi Article draft

---

## 📋 Requirements

| Requirement | Details |
|---|---|
| **Strapi** | v5.0.0 or higher |
| **Node.js** | v18+ |
| **Apify account** | Free tier works. Get a token at [console.apify.com](https://console.apify.com/account#/integrations) |
| **Google AI Studio** | API key for Gemini. Get one at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

---

## 📦 Installation

### 1. Clone or copy the plugin

```bash
# Clone into your Strapi project
cd your-strapi-project
git clone https://github.com/YOUR_USERNAME/strapi-plugin-ai-youtube-article.git src/plugins/ai-youtube-article
```

Or manually copy the plugin folder to:
```
your-strapi-project/
└── src/
    └── plugins/
        └── ai-youtube-article/   ← this plugin
```

### 2. Register the plugin

Add it to your `config/plugins.ts` (or `config/plugins.js`):

```ts
export default () => ({
  'ai-youtube-article': {
    enabled: true,
    resolve: './src/plugins/ai-youtube-article',
  },
});
```

### 3. Set environment variables

Add to your `.env` file:

```env
APIFY_API_TOKEN=apify_api_YOUR_TOKEN_HERE
GEMINI_API_KEY=AIzaSyYOUR_KEY_HERE

# Optional (have sensible defaults)
APIFY_ACTOR_ID=1s7eXiaukVuOr4Ueg
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Build and start

```bash
npx strapi build
npm run develop
```

The plugin will appear in the Strapi sidebar as **"AI YouTube Article"** and in **Settings → AI YouTube Article**.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `APIFY_API_TOKEN` | Your Apify API token | — | ✅ Yes |
| `APIFY_ACTOR_ID` | Apify YouTube transcript actor ID | `1s7eXiaukVuOr4Ueg` | No |
| `GEMINI_API_KEY` | Google Gemini API key | — | ✅ Yes |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.5-flash` | No |

### Admin Settings UI

You can also configure everything from **Settings → AI YouTube Article** in the Strapi admin:

- **Connection tab** — Set Apify token, actor ID, Gemini key, and model. Test credentials with the "Test Connection" button.
- **Performance tab** — Adjust the polling interval (how often the UI checks job status). Default: 5000ms (5 seconds).

> Settings entered in the admin UI are saved to the database and take priority over environment variables.

---

## 🖥️ Usage

### Creating an Article

1. Open **AI YouTube Article** from the Strapi sidebar
2. Paste a YouTube URL in the input field (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Click **"Generate Article"**
4. Watch the progress bar as it moves through each stage
5. Once complete, click the job to see the generated article
6. Click **"Create Article"** to save it as a draft Strapi Article

### Managing Jobs

- **Home page** — Shows recent jobs with stats (total, pending, processing, completed, failed)
- **History page** — Full paginated table with search and status filtering
- **Job detail modal** — Click any job for full details, metadata, and article preview
- **Retry** — Re-run a failed job with the same YouTube URL
- **Delete** — Remove a job from the database

---

## 🗂️ Plugin Structure

```
ai-youtube-article/
│
├── admin/src/                  # ── Frontend (React) ──
│   ├── api/
│   │   ├── client.ts           # HTTP client wrapper (uses Strapi's fetchClient)
│   │   ├── jobs.ts             # All API call functions (jobs, settings, health)
│   │   └── types.ts            # TypeScript interfaces for Job, Settings
│   ├── assets/
│   │   └── sls-light-logo.png  # Plugin branding logo
│   ├── components/
│   │   ├── ArticlePreview.tsx   # Markdown → rendered article preview
│   │   ├── BrandingFooter.tsx   # Footer with credits
│   │   ├── ConfirmDialog.tsx    # Reusable confirmation dialog
│   │   ├── HtmlContent.tsx      # Safe HTML renderer
│   │   ├── JobDetailModal.tsx   # Full job details in a modal
│   │   ├── JobStatus.tsx        # Status badge + progress bar
│   │   ├── JobsOverview.tsx     # Recent jobs list with actions
│   │   ├── PluginHeader.tsx     # Page header with logo
│   │   ├── PluginHeaderTitle.tsx # Styled title component
│   │   ├── PluginIcon.tsx       # Sidebar icon
│   │   └── UrlForm.tsx          # YouTube URL input form
│   ├── hooks/
│   │   ├── useJobs.ts           # React Query hooks for jobs
│   │   └── useSettings.ts      # React Query hooks for settings
│   ├── pages/
│   │   ├── App/index.tsx        # Route definitions (Home, History)
│   │   ├── Home/index.tsx       # Main dashboard page
│   │   ├── History/index.tsx    # Full job history table
│   │   └── Settings/index.tsx   # Plugin settings page (Connection, Performance)
│   ├── utils/
│   │   └── normalizeJob.ts      # Normalize job data from API
│   ├── index.tsx                # Plugin registration (menu link, settings section)
│   └── pluginId.ts              # Plugin identifier constant
│
├── server/                      # ── Backend (Strapi) ──
│   ├── config/
│   │   └── index.ts             # Default plugin configuration
│   ├── content-types/
│   │   └── ai-job/
│   │       ├── index.ts         # Content type export
│   │       └── schema.json      # AI Job schema (youtubeUrl, status, progress, articleTitle, etc.)
│   ├── controllers/
│   │   ├── ai-job.ts            # Job CRUD + create-article, retry, refresh, health
│   │   ├── index.ts             # Controller exports
│   │   └── settings.ts          # Settings find, update, testConnection
│   ├── routes/
│   │   ├── admin.ts             # All admin routes (authenticated)
│   │   └── index.ts             # Route exports
│   ├── services/
│   │   ├── ai-job.ts            # Core service: createJob, processJob, pipeline logic
│   │   ├── apify-client.ts      # Apify API client (start run, poll, get transcript)
│   │   ├── connection.ts        # Connection test service (parallel health checks)
│   │   ├── gemini-client.ts     # Gemini API client (generate article, retry on 429)
│   │   ├── index.ts             # Service exports
│   │   └── settings.ts          # Settings get/update with env fallbacks
│   └── index.ts                 # Server entry point
│
├── docs/                        # Additional documentation
├── package.json                 # Dependencies and plugin metadata
├── tsconfig.json                # TypeScript config
└── .gitignore                   # Git ignore rules
```

---

## 🔌 API Reference

All admin routes are prefixed with `/ai-youtube-article` and require admin authentication.

### Settings

| Method | Route | Description |
|---|---|---|
| `GET` | `/settings` | Get current plugin settings |
| `PUT` | `/settings` | Update plugin settings |
| `POST` | `/test-connection` | Test Apify + Gemini credentials |

### Jobs

| Method | Route | Description |
|---|---|---|
| `GET` | `/jobs` | List all jobs (paginated, filterable) |
| `POST` | `/jobs` | Create a new job from a YouTube URL |
| `GET` | `/jobs/summary` | Get job count statistics |
| `GET` | `/jobs/:id` | Get a single job by ID |
| `GET` | `/jobs/:id/render` | Get rendered article HTML |
| `POST` | `/jobs/:id/create-article` | Create a Strapi Article draft from completed job |
| `POST` | `/jobs/:id/retry` | Retry a failed job |
| `POST` | `/jobs/:id/refresh` | Refresh status of a job |
| `DELETE` | `/jobs/:id` | Delete a job |

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Public health check (no auth required) |

---

## 🗄️ Data Model — AI Job

Each job is stored as a `plugin::ai-youtube-article.ai-job` content type:

| Field | Type | Description |
|---|---|---|
| `youtubeUrl` | String | The submitted YouTube video URL |
| `status` | Enum | `pending` → `processing` → `completed` / `failed` |
| `progress` | Integer | 0-100 percentage |
| `articleTitle` | String | Generated article headline |
| `articleContent` | Text | Full generated article (Markdown) |
| `articleSummary` | Text | 2-3 sentence summary |
| `metadata` | JSON | Video metadata (channel, views, likes, thumbnail, tags, etc.) |
| `errorMessage` | Text | Error description if job failed |
| `errorDetails` | JSON | Detailed error stack/info |
| `createdArticle` | Relation | Link to the created Strapi Article (if published) |
| `completedAt` | DateTime | When the job finished |

---

## 🔑 Apify Setup

1. Create a free account at [apify.com](https://apify.com)
2. Go to **Account → Integrations** and copy your **API Token**
3. The plugin uses the [YouTube Transcript Scraper](https://apify.com/karamelo/youtube-transcripts) actor (ID: `1s7eXiaukVuOr4Ueg`) by default
4. Paste your token in the plugin settings or `.env`

---

## 🔑 Gemini Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. The plugin uses `gemini-2.5-flash` by default (fast and cost-effective)
4. Paste your key in the plugin settings or `.env`

> **Note:** Gemini's free tier has rate limits. If you hit 429 errors, the plugin automatically retries with exponential backoff (up to 4 retries). For heavy usage, enable billing on your Google Cloud project.

---

## 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| **"Test Connection" fails for Apify** | Verify your API token at [console.apify.com](https://console.apify.com). Make sure the actor ID is correct. |
| **"Test Connection" fails for Gemini** | Verify your API key at [aistudio.google.com](https://aistudio.google.com). Check if the key is enabled. |
| **Job stuck at 15%** | Apify is still scraping. Some videos take longer. Check Apify console for actor run status. |
| **Job fails with "No transcript data"** | The video doesn't have captions/subtitles. Only videos with CC work. |
| **Job fails with "Transcript is empty"** | Captions exist but are empty. Try a different video. |
| **Gemini 429 errors** | Rate limited. The plugin retries automatically. For sustained usage, enable billing on Google Cloud. |
| **401 Unauthorized on API calls** | Make sure you're logged into Strapi admin. All routes require authentication. |
| **Plugin not showing in sidebar** | Rebuild with `npx strapi build` and restart. Check `config/plugins.ts` has the plugin enabled. |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **CMS** | Strapi v5 |
| **Frontend** | React 18, Strapi Design System, React Query |
| **Transcript** | Apify (YouTube Transcript Scraper actor) |
| **AI** | Google Gemini API (gemini-2.5-flash) |
| **Language** | TypeScript |
| **Database** | Any Strapi-supported DB (SQLite, PostgreSQL, MySQL) |

---

## 🏢 Author

**Star Labs Technology**  
🌐 [starlabs.net.au](https://starlabs.net.au)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© Star Labs Technology — [starlabs.net.au](https://starlabs.net.au)

---

> Built with ❤️ by [Star Labs Technology](https://starlabs.net.au) for content teams who want to turn videos into articles without leaving Strapi.
