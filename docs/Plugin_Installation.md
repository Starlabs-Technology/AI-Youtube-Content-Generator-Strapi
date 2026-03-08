# AI YouTube Article — Plugin Installation

This document explains how to install and enable the `ai-youtube-article` plugin in a Strapi project (local plugin copy or published npm package).

## Overview

There are two common ways to use this plugin:
- Local copy: place the plugin under `src/plugins/ai-youtube-article` (useful for internal projects or when developing the plugin). ✅
- Published package: publish to npm and install with `npm install ai-youtube-article` (useful for distribution).

This guide covers both approaches but emphasizes the local copy workflow used in this repository.

---

## Installation (local copy in `src/plugins`)

1) Enable the plugin in your project configuration

Add the plugin entry to `config/plugins.ts` (or `config/plugins.js`) so Strapi knows to load it from the local path:

```ts
// config/plugins.ts
export default () => ({
  'ai-youtube-article': {
    enabled: true,
    resolve: './src/plugins/ai-youtube-article',
  },
});
```

2) Install the plugin dependencies

Recommended: install the dependencies in your project root so the admin build and server runtime can resolve them cleanly.

```bash
# from project root
npm install @strapi/design-system @strapi/icons axios react-query

# verify peer deps and install if missing
npm install react react-dom react-router-dom styled-components
```

Alternative: install dependencies locally inside the plugin folder:

```bash
cd src/plugins/ai-youtube-article
npm install
```

3) Rebuild the admin UI and restart Strapi

The admin bundle must be rebuilt for any admin UI changes to be picked up.

```bash
# clear caches (optional but recommended for a clean rebuild)
rm -rf .strapi node_modules/.strapi/vite

# rebuild the admin bundle
npm run build

# start in dev mode
npm run develop
```

4) (Optional) Enable the plugin cron tasks

If you want scheduled sync jobs provided by the plugin, add or merge the plugin cron task into your project `config/cron-tasks.ts` (or create a task file). Example:

```ts
// config/cron-tasks.ts
export default {
  aiYoutubeArticleSync: {
    task: async ({ strapi }: { strapi: any }) => {
      const service = strapi.plugin('ai-youtube-article').service('ai-job');
      await service.syncActiveJobs({ limit: 50 });
    },
    options: { rule: '*/1 * * * *' }, // every minute — change as needed
  },
};
```

---

## Installation (published npm package)

If the plugin is published to npm as `ai-youtube-article`:

```bash
# install
npm install ai-youtube-article

# then enable it in config/plugins.ts (no `resolve` path required)
export default () => ({
  'ai-youtube-article': { enabled: true },
});
```

Then rebuild the admin and restart (see step 3 above).

---

## Verification checklist ✅

- On Strapi startup, server logs include messages indicating the plugin registered and booted without errors. 🔍
- The plugin appears in the Strapi Admin UI (left menu and plugin pages load). 🧭
- Plugin API routes respond to requests (use an Admin token or Postman to test endpoints). 📬
- Cron tasks (if enabled) run at the configured interval and do not throw errors. ⏱️

Example API test (replace TOKEN and URL):

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:1337/api/ai-youtube-article/health
```

---

## Troubleshooting & tips ⚠️

- If you see errors about missing modules (e.g., `Cannot find module 'ts-node/register'`), ensure required dev/runtime helpers are installed. For example:

```bash
npm install -D ts-node
```

- If admin UI changes do not appear, make sure you rebuilt the admin (`npm run build`) and cleared any strapi/vite caches.
- If the plugin uses TypeScript server code (e.g., `strapi-server.ts`), ensure the project environment can run TypeScript files or compile them first. Installing `ts-node` or using precompiled `.js` server entry points resolves most issues.
- Prefer installing plugin dependencies in the project root to avoid module resolution issues during admin builds.

---

## Publishing to npm (optional)

To distribute the plugin as an npm package:

1. Update package metadata in `src/plugins/ai-youtube-article/package.json`.
2. Build any necessary admin assets and ensure `exports` fields are correct.
3. Publish with `npm publish` from the plugin folder (or a packaged repository).

---

## Notes for maintainers

- Commit the `config/plugins.ts` change and any `package.json` dependency additions together so other contributors can reproduce the setup.
- Rebuilding the admin is required for production deployments; schedule accordingly.

---

If you'd like, I can create a small script or git diff that applies the `config/plugins.ts` change and lists the exact `npm install` commands to run — say the word and I’ll prepare it. ✨