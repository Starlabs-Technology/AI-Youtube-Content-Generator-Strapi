# Getting Started with AI YouTube Article Plugin

**Quick reference guide for understanding and building the plugin**

---

## 🎯 What This Plugin Does

Converts YouTube videos into draft articles automatically using AI:

1. **Editor submits** YouTube URL in Strapi admin
2. **Python service** downloads, transcribes (Whisper), generates article (Gemini AI)
3. **Editor reviews** generated content in preview
4. **Editor creates** draft article for manual review and publishing

**Key principle:** Never auto-publish. Always draft-first for editorial control.

---

## 📚 Documentation Map

| File | Read This If... | Time |
|------|----------------|------|
| [README.md](README.md) | You want a feature overview and user guide | 10 min |
| [GETTING_STARTED.md](GETTING_STARTED.md) | You're brand new (you are here!) | 5 min |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | You're building the plugin step-by-step | 60 min |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | You want to understand system design | 30 min |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | You're integrating with the REST API | 20 min |

---

## 🏗️ Plugin Architecture in 60 Seconds

```
┌─────────────────┐
│  Browser UI     │  Submit URL → View Status → Create Draft
│  (React)        │
└────────┬────────┘
         │ HTTP (JWT Auth)
         ▼
┌─────────────────┐
│  Strapi Plugin  │  Manage jobs → Call Python → Create articles
│  (Node.js)      │
└────────┬────────┘
         │ HTTP (API Key)
         ▼
┌─────────────────┐
│  Python Service │  Download → Transcribe → AI Generate
│  (FastAPI)      │
└─────────────────┘
```

**Data Storage:**
- **Jobs** → Strapi database (`ai_jobs` table)
- **Articles** → Strapi database (`articles` table, draft mode)
- **Python state** → In-memory (temporary)

---

## 📂 Folder Structure Simplified

```
ai-youtube-article/
│
├── 📄 Documentation files (README, guides)
├── 📄 strapi-admin.tsx & strapi-server.ts (entry points)
│
├── admin/                    # Frontend (React)
│   ├── pages/               # Home, History, Settings
│   ├── components/          # UrlForm, JobStatus, ArticlePreview
│   ├── hooks/               # React Query data fetching
│   └── api/                 # HTTP client
│
└── server/                  # Backend (Node.js)
    ├── content-types/       # ai-job database schema
    ├── controllers/         # HTTP request handlers
    ├── services/            # Business logic + Python client
    └── routes/              # URL → controller mapping
```

**3 Key Files to Understand:**
1. `server/services/ai-job.ts` - Core job management logic
2. `server/services/python-client.ts` - Python API integration
3. `admin/src/pages/Home/index.tsx` - Main user interface

---

## 🚀 Quick Start (5 Steps)

### 1. **Prerequisites Check**

```bash
# Node.js 18+
node --version

# Strapi 5.x running
cd sen-news-strapi && npm run strapi version

# Python service running
curl http://localhost:8000/health
```

### 2. **Install Plugin**

```bash
# Navigate to Strapi project
cd sen-news-strapi

# Create plugin directory
mkdir -p src/plugins/ai-youtube-article

# Copy plugin files (from your plugin folder)
cp -r /path/to/ai-youtube-article-plugin/* src/plugins/ai-youtube-article/
```

### 3. **Configure**

Edit `sen-news-strapi/config/plugins.ts`:

```typescript
export default {
  'ai-youtube-article': {
    enabled: true,
    config: {
      pythonServiceUrl: env('TRANSCRIBER_URL', 'http://localhost:8000'),
      pythonApiKey: env('TRANSCRIBER_API_KEY', 'supersecret'),
    }
  }
};
```

Add to `.env`:
```bash
TRANSCRIBER_URL=http://localhost:8000
TRANSCRIBER_API_KEY=supersecret
```

### 4. **Build & Run**

```bash
# Build admin panel
npm run build

# Start Strapi
npm run develop
```

### 5. **Test It**

1. Open Strapi admin: http://localhost:1337/admin
2. Click "AI YouTube Article" in sidebar
3. Paste YouTube URL (e.g., https://youtube.com/watch?v=dQw4w9WgXcQ)
4. Click "Generate Article"
5. Wait 2-5 minutes
6. Preview → Click "Create Draft Article"
7. Edit in Content Manager → Publish

---

## 🛠️ Development Workflow

### If You're **Building the Plugin from Scratch:**

1. **Read** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Follow Phase 1-4 step-by-step
2. **Copy/paste** code from guide into files
3. **Test** each phase before moving to next
4. **Verify** with real YouTube video

**Estimated time:** 4-6 hours for complete implementation

---

### If You're **Modifying Existing Plugin:**

1. **Read** [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Understand system design
2. **Identify** which layer to modify:
   - UI change? → `admin/src/pages/` or `admin/src/components/`
   - Business logic? → `server/services/ai-job.ts`
   - API change? → `server/controllers/` + `server/routes/`
   - Python integration? → `server/services/python-client.ts`
3. **Make changes**
4. **Rebuild:** `npm run build && npm run develop`
5. **Test** in browser

---

### If You're **Integrating via API:**

1. **Read** [API_REFERENCE.md](docs/API_REFERENCE.md) - Complete endpoint docs
2. **Get Strapi token** (Settings → API Tokens)
3. **Make requests:**
   ```javascript
   // Create job
   POST /api/ai-youtube-article/jobs
   { "youtubeUrl": "https://..." }
   
   // Check status
   GET /api/ai-youtube-article/jobs/1
   
   // Create article
   POST /api/ai-youtube-article/jobs/1/create-article
   ```
**Job detail contract (important)**

- `GET /api/ai-youtube-article/jobs/{id}` returns the full job resource with all result fields. The response **must** include (when available):
  - `articleTitle`, `articleSummary`, `articleContent`
  - `status`, `progress`, `errorMessage`, `errorDetails`
  - `metadata` object with canonical keys: `start_time`, `end_time`, `duration_seconds`, `processing_time`, `model_used`, `source_url`

> UI note: The admin UI expects a single request to return a complete job object — no partial or chunked loading — so implementations should return a full payload for the job detail endpoint.
---

## 🧩 Key Concepts Explained

### 1. **Why Two Services (Strapi + Python)?**

- **Strapi** = Content management, user auth, database, admin UI
- **Python** = Heavy processing (video download, Whisper AI, Gemini AI)

Separation allows:
- Strapi stays fast and responsive
- Python can use specialized ML libraries
- Independent scaling

### 2. **Why Polling Instead of Webhooks?**

Current implementation polls Python service every 5 seconds.

**Pros:**
- Simple to implement
- No network configuration needed
- Works behind firewalls

**Future:** Webhooks for real-time updates (see ARCHITECTURE.md)

### 3. **Why Draft-Only Articles?**

AI-generated content **always** needs human review:
- Fact-checking
- Tone adjustment
- Category/author assignment
- SEO optimization

Draft mode (`publishedAt: null`) enforces editorial workflow.

### 4. **Why Store Full Text Separately?**

Article stored in two places:
1. **`content` field** → Dynamic zone blocks (editable paragraphs)
2. **`aiTranscription` field** → Full text backup (searchable, auditable)

Benefits:
- Editors can restructure content without losing original
- Full-text search works
- Audit trail of AI output

---

## 🎓 Learning Path

### **Beginner (Just Want to Use It)**

1. Read: [README.md](README.md) → User Guide section
2. Watch: (Create video tutorial if available)
3. Try: Submit a YouTube URL in admin panel

### **Intermediate (Want to Understand It)**

1. Read: [ARCHITECTURE.md](docs/ARCHITECTURE.md) → Data Flow section
2. Explore: Strapi admin panel → Content Manager → ai-job
3. Test: Create jobs, check database, review Python logs

### **Advanced (Want to Build/Modify It)**

1. Read: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) → All phases
2. Code: Follow step-by-step, test each component
3. Extend: Add features (multi-language, batch processing, webhooks)

---

## 🔍 Debugging Tips

### Job Status Not Updating?

```bash
# Check Python service logs
cd transcriber && tail -f logs/app.log

# Check Strapi logs
cd sen-news-strapi && npm run develop
# Look for "ai-youtube-article" logs
```

### Article Creation Fails?

```bash
# Verify Article content type has:
# - content (dynamic zone)
# - aiTranscription (text field)
# - publishedAt (datetime, nullable)

# Check: sen-news-strapi/src/api/article/content-types/article/schema.json
```

### Python Service Connection Error?

```bash
# Test manually
curl -X POST http://localhost:8000/api/generate-article \
  -H "x-api-key: supersecret" \
  -H "Content-Type: application/json" \
  -d '{"source_type":"youtube","source_url":"https://youtube.com/watch?v=test","sync":false}'

# Should return: {"status":"processing","job_id":"..."}
```

---

## 📊 Success Checklist

Before considering plugin "complete":

- [ ] Backend: All 7 API endpoints working (`POST /jobs`, `GET /jobs`, etc.)
- [ ] Frontend: All 3 pages rendering (Home, History, Settings)
- [ ] Integration: Python service reachable and responding
- [ ] Database: `ai_jobs` table created with all fields
- [ ] Permissions: Plugin visible in admin panel menu
- [ ] Testing: Successfully processed at least one YouTube video
- [ ] Errors: Failed jobs show error messages and can be retried
- [ ] Articles: Draft articles created with proper structure
- [ ] Documentation: Team can follow README to use plugin

---

## 🤝 Getting Help

### Self-Service

1. Check [Troubleshooting](#debugging-tips) section above
2. Review [API_REFERENCE.md](docs/API_REFERENCE.md) for endpoint details
3. Examine [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design

### Ask for Help

Include in your question:
- **What you tried:** Steps taken, commands run
- **What happened:** Error messages, logs, screenshots
- **What you expected:** Desired outcome
- **Environment:** Node version, Strapi version, OS

### Useful Log Locations

```bash
# Strapi server logs (console output)
npm run develop

# Python service logs
transcriber/logs/app.log

# Browser console (F12 → Console tab)
# Check for network errors, React errors
```

---

## 🎉 Next Steps

**After completing basic setup:**

1. **Test thoroughly** - Try different video types, languages
2. **Configure permissions** - Settings → Roles → Editor/Admin
3. **Monitor performance** - Track job completion times
4. **Gather feedback** - Ask editors what works/doesn't work
5. **Plan enhancements** - Review roadmap in README.md

**Happy coding! 🚀**

---

**Questions? Start with [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed build instructions.**
