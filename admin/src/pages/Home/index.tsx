import React, { useState, Suspense } from 'react';
import {
  Box,
  Button,
  Alert,
  Grid,
  Typography,
  Flex,
  Divider,
} from '@strapi/design-system';
import { Cog } from '@strapi/icons';
import { Layouts, useNotification, useFetchClient } from '@strapi/strapi/admin';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { useCreateJob, useJob, useCreateArticle, useJobStats } from '../../hooks/useJobs';
import { UrlForm } from '../../components/UrlForm';
import { JobStatus } from '../../components/JobStatus';
const ArticlePreview = React.lazy(() => import('../../components/ArticlePreview').then((mod) => ({ default: (mod as any).ArticlePreview })));
import { JobsOverview } from '../../components/JobsOverview';
const JobDetailModal = React.lazy(() => import('../../components/JobDetailModal').then((mod) => ({ default: (mod as any).JobDetailModal })));
import { PluginHeader } from '../../components/PluginHeader';
import { BrandingFooter } from '../../components/BrandingFooter';

const HomePage: React.FC = () => {
  const [modalJobId, setModalJobId] = useState<number | null>(null);
  
  // Use React Query hook for job stats - auto-refreshes when jobs are active
  const { data: jobStats } = useJobStats();
  const totalJobs = jobStats?.total || 0;
  const pendingCount = jobStats?.pending || 0;
  const processingCount = jobStats?.processing || 0;
  const completedCount = jobStats?.completed || 0;
  const failedCount = jobStats?.failed || 0;
  
  const { post } = useFetchClient();
  const navigate = useNavigate();
  const { search } = window.location as Location;

  // Initialize modalJobId from querystring (e.g., ?jobId=123)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(search);
      const id = params.get('jobId');
      if (id) {
        const parsed = parseInt(id, 10);
        if (!Number.isNaN(parsed)) {
          setModalJobId(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse jobId from URL', e);
    }
  }, [search]);
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const createJob = useCreateJob();
  const { data: job, isLoading: jobLoading } = useJob(modalJobId);
  const createArticle = useCreateArticle();

  const handleSubmit = async (url: string) => {
    try {
      // Use Strapi's fetch client directly like Settings page does
      const response = await post('/ai-youtube-article/jobs', { youtubeUrl: url });
      const newJob = response.data.data;
      
      console.log('Job created:', newJob);
      
      if (!newJob || !newJob.id) {
        throw new Error('Invalid response: missing job ID');
      }
      
      // Instantly update all jobs caches (different query keys for different pageSize values)
      queryClient.setQueriesData({ queryKey: ['jobs'] }, (old: any) => {
        if (!old) return { data: [newJob], meta: { pagination: { total: 1 } } };
        return {
          ...old,
          data: [newJob, ...(old.data || [])],
          meta: { ...old.meta, pagination: { ...old.meta?.pagination, total: (old.meta?.pagination?.total || 0) + 1 } }
        };
      });
      
      // Instantly update job stats (optimistic update)
      queryClient.setQueryData(['jobStats'], (old: any) => {
        if (!old) return { total: 1, pending: 1, processing: 0, completed: 0, failed: 0 };
        return {
          ...old,
          total: (old.total || 0) + 1,
          pending: (old.pending || 0) + 1,
        };
      });
      
      // Update the individual job query
      queryClient.setQueryData(['job', newJob.id], newJob);
      
      // Also invalidate to trigger background refetch for accurate data
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobStats'] });
      
      console.log('✅ Cache updated with new job');
      
      // If the job was created but failed to initialize, show an error to the user
      if (newJob.status === 'failed') {
        console.error('Job was created but marked as failed:', newJob.errorMessage);
        toggleNotification({
          type: 'danger',
          message: newJob.errorMessage || 'Job creation failed during initialization',
        });
      } else {
        console.log('Job created, background processing started:', newJob.id);
        toggleNotification({
          type: 'success',
          message: 'Job created and processing started',
        });
      }
      
      // Open modal after a short delay so notification is visible
      setTimeout(() => setModalJobId(newJob.id), 300);
    } catch (error) {
      console.error('Job creation failed:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any)?.response?.data?.error?.message
        : error instanceof Error
        ? error.message
        : 'Failed to create job';
      toggleNotification({
        type: 'danger',
        message: errorMessage,
      });
    }
  };

  const handleCreateArticle = async () => {
    if (!modalJobId) return;

    try {
      const result = await createArticle.mutateAsync(modalJobId);
      toggleNotification({
        type: 'success',
        message: 'Draft article created successfully',
      });
      window.location.href = `/admin/content-manager/collection-types/api::article.article/${result.articleId}`;
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: error instanceof Error ? error.message : 'Failed to create article',
      });
    }
  };

  return (
    <>
      <PluginHeader
        title="AI Youtube Content Generator"
        subtitle="Generate articles from YouTube videos using AI-powered transcription"
        primaryAction={
          <Button
            variant="tertiary"
            startIcon={<Cog />}
            onClick={() => navigate('/settings/ai-youtube-article')}
          >
            Settings
          </Button>
        }
      />
      <Layouts.Content>
        <Box padding={8}>
          {/* Stats Bar */}
          <Box marginBottom={6}>
            <Flex gap={4} wrap="wrap">
              {/* Total Jobs */}
              <Box
                flex="1"
                style={{ minWidth: 160 }}
                background="neutral0"
                hasRadius
                shadow="tableShadow"
                padding={5}
              >
                <Flex direction="column" gap={2}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Typography variant="pi" textColor="neutral500" style={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Total Jobs</Typography>
                    <Box style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,130,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, lineHeight: 1 }}>📋</span></Box>
                  </Flex>
                  <Typography variant="alpha" fontWeight="bold" style={{ fontSize: '2rem', lineHeight: 1 }}>{totalJobs}</Typography>
                  <Box style={{ height: 3, borderRadius: 2, background: '#8b82ff', marginTop: 4 }} />
                </Flex>
              </Box>

              {/* Processing */}
              <Box
                flex="1"
                style={{ minWidth: 160 }}
                background="neutral0"
                hasRadius
                shadow="tableShadow"
                padding={5}
              >
                <Flex direction="column" gap={2}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Typography variant="pi" style={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, color: '#4945ff' }}>Processing</Typography>
                    <Box style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(73,69,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, lineHeight: 1 }}>⚙️</span></Box>
                  </Flex>
                  <Typography variant="alpha" fontWeight="bold" style={{ fontSize: '2rem', lineHeight: 1, color: '#4945ff' }}>{pendingCount + processingCount}</Typography>
                  <Box style={{ height: 3, borderRadius: 2, background: '#4945ff', marginTop: 4 }} />
                </Flex>
              </Box>

              {/* Completed */}
              <Box
                flex="1"
                style={{ minWidth: 160 }}
                background="neutral0"
                hasRadius
                shadow="tableShadow"
                padding={5}
              >
                <Flex direction="column" gap={2}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Typography variant="pi" style={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, color: '#328048' }}>Completed</Typography>
                    <Box style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(50,128,72,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, lineHeight: 1 }}>✅</span></Box>
                  </Flex>
                  <Typography variant="alpha" fontWeight="bold" style={{ fontSize: '2rem', lineHeight: 1, color: '#328048' }}>{completedCount}</Typography>
                  <Box style={{ height: 3, borderRadius: 2, background: '#328048', marginTop: 4 }} />
                </Flex>
              </Box>

              {/* Failed */}
              <Box
                flex="1"
                style={{ minWidth: 160 }}
                background="neutral0"
                hasRadius
                shadow="tableShadow"
                padding={5}
              >
                <Flex direction="column" gap={2}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Typography variant="pi" style={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, color: '#d02b20' }}>Failed</Typography>
                    <Box style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(208,43,32,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, lineHeight: 1 }}>❌</span></Box>
                  </Flex>
                  <Typography variant="alpha" fontWeight="bold" style={{ fontSize: '2rem', lineHeight: 1, color: '#d02b20' }}>{failedCount}</Typography>
                  <Box style={{ height: 3, borderRadius: 2, background: '#d02b20', marginTop: 4 }} />
                </Flex>
              </Box>
            </Flex>
          </Box>

          <Box marginBottom={6}>
            <Box
              background="neutral0"
              hasRadius
              shadow="tableShadow"
              padding={6}
            >
              <Flex direction="column" alignItems="stretch" gap={6}>
                <Typography variant="beta" fontWeight="bold" style={{ fontSize: '1.5rem' }}>
                  Create New Job
                </Typography>
                <Divider />
                <Typography variant="omega" textColor="neutral600">
                  Enter a YouTube video URL to generate an AI-powered article with automatic transcription and intelligent content extraction.
                </Typography>
                <UrlForm
                  onSubmit={handleSubmit}
                  isLoading={createJob.isLoading}
                />
              </Flex>
            </Box>
          </Box>

          <Box paddingTop={6}>
            <JobsOverview limit={5} />
          </Box>

          {/* Current Job Status */}
          {jobLoading && modalJobId && (
            <Box paddingTop={6}>
              <Box
                background="neutral0"
                hasRadius
                shadow="tableShadow"
                padding={8}
              >
                <Flex direction="column" gap={4}>
                  <Box background="neutral150" height="32px" hasRadius width="30%" />
                  <Box background="neutral150" height="12px" hasRadius />
                  <Box background="neutral150" height="80px" hasRadius />
                </Flex>
              </Box>
            </Box>
          )}

          {job && !jobLoading && (
            <Box paddingTop={6}>
              <JobStatus job={job} />

              {job.status === 'completed' && (
                <>
                  <Box paddingTop={6}>
                    <Suspense fallback={<Box>Loading preview…</Box>}>
                      <ArticlePreview job={job} />
                    </Suspense>
                  </Box>

                  <Box paddingTop={6}>
                    <Flex justifyContent="center">
                      <Button
                        onClick={handleCreateArticle}
                        loading={createArticle.isLoading}
                        disabled={!!job.createdArticle}
                        size="L"
                      >
                        {job.createdArticle
                          ? '✓ Article Created'
                          : 'Create Draft Article'}
                      </Button>
                    </Flex>
                  </Box>
                </>
              )}

              {job.status === 'failed' && (
                <Box paddingTop={6}>
                  <Alert
                    variant="danger"
                    title="Job Failed"
                    closeLabel="Close"
                  >
                    {job.errorMessage}
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Layouts.Content>
      {/* Job Detail Modal */}
      {modalJobId && (
        <Suspense fallback={<div />}>
          <JobDetailModal jobId={modalJobId} onClose={() => setModalJobId(null)} />
        </Suspense>
      )}

      <BrandingFooter />
    </>
  );
};

export default HomePage;
