# AI YouTube Article — Strapi v5 Plugin

Convert YouTube videos into full-length articles using **Apify** (transcript scraping) and **Google Gemini** (AI content generation).

![Strapi v5](https://img.shields.io/badge/Strapi-v5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎬 Paste a YouTube URL and get a complete, publish-ready article
- 📝 Apify-powered transcript extraction (supports captions)
- 🤖 Google Gemini AI generates structured articles with headlines, subheadings, and body text
- 📊 Real-time job progress tracking in the admin panel
- ⚙️ Configurable settings — API keys, model selection, polling interval
- 🔄 Retry / refresh failed jobs from the UI

## How It Works

1. **Submit** a YouTube URL from the Strapi admin panel
2. **Apify** scrapes the video's transcript/captions
3. **Gemini AI** transforms the transcript into a structured article
4. **Review** the generated article and publish it

## Requirements

- Strapi v5
- [Apify](https://apify.com) account + API token
- [Google AI Studio](https://aistudio.google.com) API key (Gemini)

## Installation

Copy (or clone) this plugin into your Strapi project:

```
src/plugins/ai-youtube-article/
```

Add it to your `config/plugins.ts`:

```ts
export default () => ({
  'ai-youtube-article': {
    enabled: true,
    resolve: './src/plugins/ai-youtube-article',
  },
});
```

Rebuild and restart Strapi:

```bash
npx strapi build
npm run develop
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `APIFY_API_TOKEN` | Your Apify API token | Yes |
| `APIFY_ACTOR_ID` | YouTube transcript actor ID (default: `1s7eXiaukVuOr4Ueg`) | No |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.5-flash`) | No |

You can also configure these from **Settings → AI YouTube Article** in the admin panel.

## Plugin Structure

```
ai-youtube-article/
├── admin/src/          # React frontend (settings, job list, article preview)
│   ├── api/            # HTTP client & API functions
│   ├── components/     # Shared UI components
│   ├── hooks/          # React hooks
│   └── pages/          # App, Settings, and content pages
├── server/             # Strapi backend
│   ├── config/         # Default plugin config
│   ├── content-types/  # ai-job content type (SQLite/DB)
│   ├── controllers/    # Admin API controllers
│   ├── routes/         # Route definitions
│   └── services/       # Apify client, Gemini client, job logic, settings
└── docs/               # Detailed architecture & API reference
```

## License

MIT
