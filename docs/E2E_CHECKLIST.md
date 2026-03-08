# E2E Validation Checklist

This checklist is intended for manual validation of the job detail flow (no automated tests required per current scope).

1. Generate job
   - In Strapi admin (AI YouTube Article plugin), paste a valid YouTube URL and click **Generate**.
   - Confirm job is created and `pythonJobId` is present in the job record.

2. Polling & Status
   - While job is processing, confirm the job list (`/plugins/ai-youtube-article`) shows progress and status updates.
   - Confirm the job's `status` transitions to `completed` (or `failed` on error) within expected time for the sample video.

3. Job Detail (single-request full payload)
   - Click the job title in **Home** or **History**. The Home page should open details for that job (via `?jobId={id}`).
   - Confirm the following fields are visible and populated when available: `articleTitle`, `articleSummary`, `articleContent`, `status`, `errors` (`errorMessage` / `errorDetails`), and `metadata` with canonical keys:
     - `start_time`, `end_time`, `duration_seconds`, `processing_time`, `model_used`, `source_url`
   - No additional, incremental calls should be necessary to display these fields.

4. Create Draft Article
   - For a completed job, click **Create Draft Article** and ensure a draft article is created in Content Manager.
   - Confirm `createdArticle` is updated on the job and the link in the UI opens the article in Content Manager.

5. Error Handling
   - Simulate a failed job (e.g., invalid source) and confirm the UI displays `errorMessage` and any `errorDetails` clearly in the Job Status and History views.

6. Backwards compatibility
   - Confirm the UI properly displays metadata if the backend provides either snake_case or camelCase variants of keys (`processing_time` / `processing_time_seconds`, `model_used` / `modelUsed`, `source_url` / `sourceUrl`).

7. Documentation
   - Confirm `GETTING_STARTED.md` contains the "Job detail contract" and links to this E2E checklist.

If all steps pass, the job detail flow is considered validated manually.