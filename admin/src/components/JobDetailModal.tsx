import React from 'react';
import {
  Dialog,
  Box,
  Flex,
  Button,
  Typography,
  Alert,
  Link,
} from '@strapi/design-system';
import { useJob, useCreateArticle, useRefreshJob } from '../hooks/useJobs';

import { useNotification } from '@strapi/strapi/admin';
import { useQueryClient } from 'react-query';
import HtmlContent from './HtmlContent';


interface JobDetailModalProps {
  jobId: number | null;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ jobId, onClose }) => {
  const isOpen = !!jobId;
  const { data: job, error, isLoading, refetch } = useJob(jobId);
  const createArticle = useCreateArticle();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();
  const refreshJob = useRefreshJob();

  // Fallback: try to read job from cache if the detailed query hasn't resolved yet
  const cachedJob = React.useMemo(() => {
    if (!jobId) return null;
    const single = queryClient.getQueryData(['job', jobId]);
    if (single) return single as any;
    // Try jobs list cache
    const list = queryClient.getQueryData(['jobs', {}]) as any;
    const arr = list?.data || [];
    return arr.find((j: any) => j.id === jobId) || null;
  }, [jobId, queryClient]);

  // Merge cached job (table) with the fresh job (detail fetch) so UI can show article fields
  // that may exist in cache while still preferring fresh fields from the detailed fetch.
  const mergedJob = React.useMemo(() => {
    if (!job && !cachedJob) return null;
    const base = { ...(cachedJob || {}), ...(job || {}) } as any;

    // Derive normalized article fields from multiple possible shapes
    const articleTitle = base.articleTitle ?? base.article_title ?? base.title ?? base.data?.headline ?? null;
    const articleContent = base.articleContent ?? base.article_content ?? base.body ?? base.articleBody ?? base.data?.article ?? null;
    const articleSummary = base.articleSummary ?? base.article_summary ?? base.excerpt ?? base.data?.summary ?? null;

    return {
      ...base,
      articleTitle,
      articleContent,
      articleSummary,
      // Keep convenience top-level fields too
      title: base.title ?? articleTitle,
      excerpt: base.excerpt ?? articleSummary,
      body: base.body ?? articleContent,
    };
  }, [job, cachedJob]);

  // Refetch job details whenever the modal is opened with a jobId
  React.useEffect(() => {
    if (jobId && refetch) {
      refetch();
    }
  }, [jobId, refetch]);

  // If job status changes to completed, poll for article fields if they're not present yet
  const [isPollingArticle, setIsPollingArticle] = React.useState(false);

  React.useEffect(() => {
    if (!jobId) return; // nothing to do

    let attempts = 0;
    const maxAttempts = 12; // ~1 minute at 5s intervals
    let timer: number | undefined;

    const shouldPoll = job && job.status === 'completed' && !(job.articleTitle || job.articleContent || job.articleSummary);

    const tryRefetch = async () => {
      // stop if we've reached max attempts
      if (attempts >= maxAttempts) {
        if (timer) clearInterval(timer);
        setIsPollingArticle(false);
        return;
      }
      attempts += 1;
      try {
        await refetch();
      } catch (e) {
        // ignore errors here; the regular error UI will show if needed
      }
    };

    if (shouldPoll) {
      setIsPollingArticle(true);
      // Try immediately, then set an interval
      tryRefetch();
      timer = window.setInterval(tryRefetch, 5000);
    } else {
      setIsPollingArticle(false);
    }

    return () => {
      if (timer) clearInterval(timer);
      setIsPollingArticle(false);
    };
  }, [job?.status, job?.articleTitle, job?.articleContent, job?.articleSummary, jobId, refetch]);


  // Debug: log job and error states to help diagnose empty modal cases
  React.useEffect(() => {
    console.debug('[JobDetailModal] job change', { jobId, job, isLoading, error, cachedJob, mergedJob, isPollingArticle });
  }, [jobId, job, isLoading, error, cachedJob, mergedJob, isPollingArticle]);

  // UI state: summary collapse
  const [summaryOpen, setSummaryOpen] = React.useState(true);

  // Copy article to clipboard
  const handleCopyArticle = async () => {
    const text = mergedJob?.articleContent ?? mergedJob?.body ?? '';
    if (!text) {
      toggleNotification({ type: 'warning', message: 'No article content to copy' });
      return;
    }

    try {
      await (navigator.clipboard as any).writeText(text);
      toggleNotification({ type: 'success', message: 'Article copied to clipboard' });
    } catch (err: any) {
      toggleNotification({ type: 'danger', message: 'Failed to copy article' });
    }
  };


  const getErrorMessage = (err: any): string | null => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (err?.response?.data?.message) return String(err.response.data.message);
    if (err?.message) return String(err.message);
    return String(err);
  };

  const isNotFound = (err: any) => {
    return err && ((err.response && err.response.status === 404) || err.status === 404 || (err.message && err.message.toLowerCase().includes('not found')));
  };

  // Reset modal-local UI state when modal closes/opens
  React.useEffect(() => {
    if (!jobId) {
      setSummaryOpen(true);
      setIsPollingArticle(false);
    } else {
      setSummaryOpen(true);
    }
  }, [jobId]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Content style={{ maxWidth: '900px', width: '100%', maxHeight: 'calc(100vh - 48px)' }}>
        <Dialog.Header>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>
              <Typography variant="delta" fontWeight="semiBold" style={{ marginBottom: 6 }}>{mergedJob?.title ?? mergedJob?.articleTitle ?? `Job ${jobId}`}</Typography>
              <Flex alignItems="center" gap={3}>
                <Typography variant="omega" textColor="neutral600">Job #{mergedJob?.id ?? jobId}</Typography>
                <Typography variant="omega" textColor="neutral600" style={{ marginLeft: 8 }}>Status: {(mergedJob?.status ?? job?.status ?? 'pending')}</Typography>
              </Flex>
            </Box>

            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* YouTube link (if available) to the left of the Close button */}
              {mergedJob?.youtubeUrl && (
                <Link
                  href={mergedJob.youtubeUrl}
                  isExternal
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
                  aria-label="Open YouTube video"
                  style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center' }}
                >
                  <span aria-hidden style={{ fontSize: 16 }}>🔗</span>
                </Link>
              )}

              {/* Explicit top-right close button */}
              <Button variant="tertiary" onClick={() => onClose()} aria-label={`Close job ${jobId}`}>Close</Button>
            </Box>
          </Box>
        </Dialog.Header>

        {/* Scrollable body */}
        <Dialog.Body>
          <Box style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 8, paddingBottom: 24, scrollBehavior: 'smooth' }}>
            {isLoading && !mergedJob && (
              <Box padding={6} style={{ textAlign: 'center' }}>
                <Typography>Loading article…</Typography>
              </Box>
            )} 

            {(error as any) && !cachedJob && !mergedJob && (
              <Box padding={4}>
                {isNotFound(error) ? (
                  <Alert variant="warning" title="Job not found" closeLabel="Close">The requested job was not found.</Alert>
                ) : (
                  (() => {
                    const errMsg = getErrorMessage(error) ?? 'Failed to load job details';
                    return <Alert variant="danger" title="Error" closeLabel="Close">{errMsg}</Alert>;
                  })()
                )}
              </Box>
            )} 

            {mergedJob && (
              <Box padding={4}>

                {/* Completed jobs that have no article content: show polling/info while we're still attempting fetches, show error only after polling exhausted */}
                {mergedJob.status === 'completed' && !(mergedJob.articleTitle || mergedJob.articleContent || mergedJob.articleSummary) && (
                  <Box paddingTop={3}>
                    {isPollingArticle ? (
                      <Alert variant="info" title="Waiting for article content" closeLabel="Close">The job is completed — attempting to fetch article content from the transcriber. We'll keep checking for updates.</Alert>
                    ) : (
                      <Alert variant="danger" title="Completed job missing article content" closeLabel="Close">The backend returned a completed job without article content after several attempts; please investigate the transcriber or Python callback.</Alert>
                    )}
                  </Box>
                )}

                {/* Summary card */}
                <Box hasRadius shadow="filterShadow" background="neutral0" padding={4} style={{ marginTop: 12 }}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Typography variant="pi" fontWeight="semiBold">Summary</Typography>
                    <Button variant="tertiary" onClick={() => setSummaryOpen((s) => !s)}>{summaryOpen ? 'Collapse' : 'Expand'}</Button>
                  </Flex>

                  {summaryOpen && (
                    <Box paddingTop={3}>
                      {/* Render bullets if summary contains line breaks or bullets else show paragraph */}
                      {mergedJob.articleSummary && mergedJob.articleSummary.includes('\n') ? (
                        <ul>
                          {mergedJob.articleSummary.split('\n').map((line: string, i: number) => (
                            <li key={i} style={{ marginBottom: 6 }}>{line.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <Typography>{mergedJob.articleSummary ?? 'No summary available.'}</Typography>
                      )}
                    </Box>
                  )}
                </Box>

                <Box style={{ marginTop: 16 }}>
                  <Box paddingTop={4}>
                    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="pi" fontWeight="semiBold">Article</Typography>
                      </Box>
                      <Flex gap={2}>
                        <Button onClick={handleCopyArticle} variant="secondary">Copy Article</Button>
                      </Flex>
                    </Box>

                    <Box id="article-body" paddingTop={3} style={{ lineHeight: 1.7, paddingBottom: 24 }}>
                      {mergedJob?.articleContent || mergedJob?.body ? (
                        <HtmlContent jobId={mergedJob.id} fallbackText={mergedJob?.articleContent ?? mergedJob?.body} />
                      ) : (
                        'No article content available.'
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Metadata & Errors */}
                <Box background="neutral0" hasRadius shadow="tableShadow" padding={4} style={{ marginTop: 16 }}>
                  <Typography variant="pi" fontWeight="semiBold">Metadata</Typography>
                  <Box paddingTop={2}>
                    <Typography variant="omega">Created: {mergedJob.createdAt}</Typography>
                    <Typography variant="omega">Updated: {mergedJob.updatedAt}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Dialog.Body>

        <Dialog.Footer>
          <Button onClick={onClose} variant="tertiary">Close</Button>
          {mergedJob && mergedJob.createdArticle && (() => {
            const createdId = typeof (mergedJob.createdArticle) === 'number' ? mergedJob.createdArticle : mergedJob.createdArticle?.id;
            if (!createdId) return null;
            return (
              <Button onClick={() => { window.location.href = `/admin/content-manager/collection-types/api::article.article/${createdId}`; }}>Open Article</Button>
            );
          })()}
        </Dialog.Footer> 
      </Dialog.Content>
    </Dialog.Root>
  );
};