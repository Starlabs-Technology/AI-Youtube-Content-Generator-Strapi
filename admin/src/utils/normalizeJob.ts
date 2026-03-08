import type { Job } from '../api/types';

export function normalizeJob(raw: any): Job | null {
  if (!raw) {
    // Graceful: return null when input missing and log for debugging
    // eslint-disable-next-line no-console
    console.debug('normalizeJob received empty input');
    return null;
  }

  const articleTitle = raw.articleTitle ?? raw.article_title ?? raw.title ?? raw.data?.headline ?? null;
  const articleContent = raw.articleContent ?? raw.article_content ?? raw.body ?? raw.articleBody ?? raw.data?.article ?? null;
  const articleSummary = raw.articleSummary ?? raw.article_summary ?? raw.excerpt ?? raw.data?.summary ?? null;

  const pythonJobId = raw.pythonJobId ?? raw.python_job_id ?? raw.job_id ?? raw.jobId ?? null;

  const normalized: any = {
    // preserve everything so updates/patches can still reference raw fields if needed
    ...raw,

    // normalized canonical fields used by the UI
    articleTitle,
    articleContent,
    articleSummary,

    // ensure pythonJobId is present when Python id was provided under other keys
    pythonJobId,

    // keep convenience top-level fields for debugging and direct UI usage
    title: raw.title ?? articleTitle,
    excerpt: raw.excerpt ?? articleSummary,
    body: raw.body ?? articleContent,
  };

  return normalized as Job;
}
