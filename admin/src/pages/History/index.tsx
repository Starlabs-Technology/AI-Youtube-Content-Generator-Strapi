import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Badge,
  Button,
  Flex,
  Typography,
  EmptyStateLayout,
  Divider,
  Link,
  Searchbar,
} from '@strapi/design-system';
import { ArrowClockwise, Eye, Plus, ExternalLink } from '@strapi/icons';
import { Layouts, useNotification, useFetchClient } from '@strapi/strapi/admin';
const JobDetailModal = React.lazy(() => import('../../components/JobDetailModal').then((mod) => ({ default: (mod as any).JobDetailModal })));
import { useNavigate, useLocation } from 'react-router-dom';
import type { Job } from '../../api/types';
import { PluginHeader } from '../../components/PluginHeader';
import { BrandingFooter } from '../../components/BrandingFooter';

const HistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleNotification } = useNotification();
  const { get } = useFetchClient();
  
  const searchParams = new URLSearchParams(location.search);
  const initialStatus = searchParams.get('status') || undefined;
  
  const [statusFilter, setStatusFilter] = useState<string | undefined>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [pageCount, setPageCount] = useState<number>(1);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppending, setIsAppending] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [processingCount, setProcessingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [modalJobId, setModalJobId] = useState<number | null>(null);

  // Fetch jobs directly from API
  const fetchJobs = async ({ page: requestedPage, append, pageSize: requestedPageSize }: { page?: number; append?: boolean; pageSize?: number } = {}) => {
    try {
      console.debug('[HistoryPage] fetchJobs called', { requestedPage, append, requestedPageSize, page, pageSize, statusFilter });
      if (append) setIsAppending(true); else setIsLoading(true);

      const currentPage = requestedPage ?? page;
      const effectivePageSize = requestedPageSize ?? pageSize;

      const params = {
        'pagination[page]': currentPage,
        'pagination[pageSize]': effectivePageSize,
        _sort: 'createdAt:desc',
        ...(statusFilter ? { status: statusFilter } : {}),
      };
      console.debug('[HistoryPage] fetching with params', params);

      const response = await get('/ai-youtube-article/jobs', { params });

      // Start with the first page's data
      let allData: Job[] = response.data.data || [];
      const pagination = response.data.meta?.pagination || {
        page: currentPage,
        pageSize: effectivePageSize,
        pageCount: 1,
        total: allData.length,
      };

      // If API returned multiple pages, fetch remaining pages and concatenate
      if (pagination.pageCount > 1) {
        const pagePromises = [] as Promise<any>[];
        for (let p = 2; p <= pagination.pageCount; p++) {
          pagePromises.push(get('/ai-youtube-article/jobs', { params: { ...params, 'pagination[page]': p } }));
        }
        const responses = await Promise.all(pagePromises);
        responses.forEach((res) => {
          allData = allData.concat(res.data.data || []);
        });
      }

      // De-duplicate jobs by id and sort by createdAt desc
      const uniqueById = new Map<number, Job>();
      allData.forEach((j) => uniqueById.set(j.id, j));
      const finalList = Array.from(uniqueById.values()).sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      if (append) {
        // Append new data but avoid duplicates by job id
        setJobs((prev) => {
          const byId = new Map<number, Job>();
          prev.forEach((j) => byId.set(j.id, j));
          finalList.forEach((j) => byId.set(j.id, j));
          return Array.from(byId.values()).sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
      } else {
        setJobs(finalList);
      }

      setPage(pagination.page);
      setPageSize(pagination.pageSize);
      setPageCount(pagination.pageCount);
      setTotalJobs(pagination.total);

    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toggleNotification({
        type: 'danger',
        message: 'Failed to load jobs',
      });
      if (!append) setJobs([]);
    } finally {
      setIsLoading(false);
      setIsAppending(false);
    }
  };

  // Fetch total counts and then fetch all jobs (no pagination) on mount and when filter changes
  useEffect(() => {
    const loadAll = async () => {
      try {
        // First fetch counts for each status so we know total jobs
        const [pendingRes, processingRes, completedRes, failedRes] = await Promise.all([
          get('/ai-youtube-article/jobs', { params: { status: 'pending', 'pagination[page]': 1, 'pagination[pageSize]': 1 } }),
          get('/ai-youtube-article/jobs', { params: { status: 'processing', 'pagination[page]': 1, 'pagination[pageSize]': 1 } }),
          get('/ai-youtube-article/jobs', { params: { status: 'completed', 'pagination[page]': 1, 'pagination[pageSize]': 1 } }),
          get('/ai-youtube-article/jobs', { params: { status: 'failed', 'pagination[page]': 1, 'pagination[pageSize]': 1 } }),
        ]);

        const p = pendingRes.data?.meta?.pagination?.total || 0;
        const proc = processingRes.data?.meta?.pagination?.total || 0;
        const comp = completedRes.data?.meta?.pagination?.total || 0;
        const fail = failedRes.data?.meta?.pagination?.total || 0;

        setPendingCount(p);
        setProcessingCount(proc);
        setCompletedCount(comp);
        setFailedCount(fail);
        const total = p + proc + comp + fail;
        setTotalJobs(total);

        // Now fetch all jobs in one go by using total as pageSize (fallback to current pageSize if total is 0)
        await fetchJobs({ page: 1, pageSize: total || pageSize });
      } catch (error) {
        // ignore counts/errors silently
      }
    };

    loadAll();
  }, [statusFilter]);

  // Auto-refresh every 5 seconds if there are active jobs on the current page
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (job) => job.status === 'pending' || job.status === 'processing'
    );
    
    if (!hasActiveJobs) return;

    const interval = setInterval(() => fetchJobs({ page }), 5000);
    return () => clearInterval(interval);
  }, [jobs, page]);

  // Filter jobs based on search (status is handled server-side)
  const filteredJobs = jobs.filter((job) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = job.youtubeUrl.toLowerCase().includes(query) ||
        job.articleTitle?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    return true;
  });



  if (isLoading) {
    return (
      <>
        <PluginHeader
          title="Job History"
          subtitle="View and manage all transcription jobs"
        />
        <Layouts.Content>
          <Box padding={6}>
            <Box background="neutral0" hasRadius shadow="tableShadow" padding={6}>
              <Flex direction="column" gap={3}>
                <Box background="neutral150" height="48px" hasRadius />
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} background="neutral100" height="56px" hasRadius />
                ))}
              </Flex>
            </Box>
          </Box>
        </Layouts.Content>
      </>
    );
  }

  return (
    <>
      <PluginHeader
        title="Job History"
        subtitle="View and manage all transcription jobs"
        primaryAction={
          <Button startIcon={<ArrowClockwise />} onClick={fetchJobs} loading={isLoading}>
            Refresh
          </Button>
        }
      />
      <Layouts.Content>
          <Box padding={8}>
          {/* Stats Bar */}
          <Box marginBottom={6}>
            <Box background="neutral0" hasRadius shadow="tableShadow" padding={6}>
              <Flex gap={8}>
                <Box>
                  <Typography variant="pi" textColor="neutral600">Total Jobs</Typography>
                  <Typography variant="alpha" fontWeight="bold">{totalJobs}</Typography>
                </Box>
                <Box>
                  <Typography variant="pi" textColor="primary600">Processing</Typography>
                  <Typography variant="alpha" fontWeight="bold" textColor="primary600">
                    {pendingCount + processingCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="pi" textColor="success600">Completed</Typography>
                  <Typography variant="alpha" fontWeight="bold" textColor="success600">
                    {completedCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="pi" textColor="danger600">Failed</Typography>
                  <Typography variant="alpha" fontWeight="bold" textColor="danger600">
                    {failedCount}
                  </Typography>
                </Box>
              </Flex>
            </Box>
          </Box>

          {/* Filter and Search Toolbar */}
          <Box marginBottom={6}>
            <Box background="neutral0" hasRadius shadow="tableShadow" padding={6}>
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Divider />
                <Flex direction="column" alignItems="stretch" gap={2}>
                  <Typography variant="omega" textColor="neutral800" fontWeight="semiBold">
                    Filter by Status:
                  </Typography>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      variant={statusFilter === undefined ? 'default' : 'tertiary'}
                      onClick={() => setStatusFilter(undefined)}
                    >
                      All Jobs ({totalJobs})
                    </Button>
                    <Button
                      variant={statusFilter === 'pending' ? 'default' : 'tertiary'}
                      onClick={() => setStatusFilter('pending')}
                    >
                      Pending ({pendingCount})
                    </Button>
                    <Button
                      variant={statusFilter === 'processing' ? 'default' : 'tertiary'}
                      onClick={() => setStatusFilter('processing')}
                    >
                      Processing ({processingCount})
                    </Button>
                    <Button
                      variant={statusFilter === 'completed' ? 'default' : 'tertiary'}
                      onClick={() => setStatusFilter('completed')}
                    >
                      Completed ({completedCount})
                    </Button>
                    <Button
                      variant={statusFilter === 'failed' ? 'default' : 'tertiary'}
                      onClick={() => setStatusFilter('failed')}
                    >
                      Failed ({failedCount})
                    </Button>
                  </Flex>
                </Flex>
              </Flex>
            </Box>
          </Box>

          {/* Jobs Table or Empty State */}
          {filteredJobs.length === 0 ? (
            <Box background="neutral0" hasRadius shadow="tableShadow" padding={11}>
              <EmptyStateLayout
                icon={<Plus width="64px" height="64px" />}
                content="No jobs found. Start by creating your first transcription job."
                action={
                  <Button
                    variant="default"
                    startIcon={<Plus />}
                    onClick={() => navigate('/plugins/ai-youtube-article')}
                  >
                    Create Job
                  </Button>
                }
              />
            </Box>
          ) : (
            <Box background="neutral0" hasRadius shadow="tableShadow" padding={0} style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <Tr>
                    <Th><Typography variant="sigma" fontWeight="semiBold">ID</Typography></Th>
                    <Th><Typography variant="sigma" fontWeight="semiBold">YouTube URL</Typography></Th>
                    <Th><Typography variant="sigma" fontWeight="semiBold">Status</Typography></Th>
                    <Th><Typography variant="sigma" fontWeight="semiBold">Progress</Typography></Th>
                    <Th><Typography variant="sigma" fontWeight="semiBold">Title</Typography></Th>
                    <Th><Typography variant="sigma" fontWeight="semiBold">Created</Typography></Th>
                    <Th><Typography variant="sigma" fontWeight="semiBold">Actions</Typography></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredJobs.map((job) => (
                    <Tr key={job.id}>
                      <Td><Typography variant="omega" fontWeight="semiBold">#{job.id}</Typography></Td>
                      <Td>
                        <Link
                          href={job.youtubeUrl}
                          isExternal
                          aria-label="Open YouTube video"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <span aria-hidden style={{ fontSize: 16 }}>🔗</span>
                        </Link>
                      </Td>
                      <Td>
                        <Badge
                          variant={
                            job.status === 'completed' ? 'success' :
                            job.status === 'failed' ? 'danger' :
                            job.status === 'processing' ? 'primary' : 'secondary'
                          }
                          size="M"
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                      </Td>
                      <Td><Typography variant="omega" textColor="neutral600">{job.progress || 0}%</Typography></Td>
                      <Td>
                        {job.status === 'completed' && job.createdArticle ? (
                          <Link
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              window.location.href = `/admin/content-manager/collection-types/api::article.article/${job.createdArticle!.id}`;
                            }}
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            <Typography variant="omega" fontWeight="semiBold">
                              {job.articleTitle || 'Untitled Article'}
                            </Typography>
                          </Link>
                        ) : (
                          <Link
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setModalJobId(job.id);
                            }}
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            <Typography variant="omega" fontWeight="semiBold">
                              {job.articleTitle || '-'}
                            </Typography>
                          </Link>
                        )} 
                      </Td>
                      <Td>
                        <Typography variant="omega" textColor="neutral600">
                          {new Date(job.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Td>
                      <Td>
                        <Flex gap={2}>
                          {job.createdArticle && (
                            <Button
                              variant="tertiary"
                              size="S"
                              startIcon={<Eye />}
                              onClick={() => {
                                window.location.href = `/admin/content-manager/collection-types/api::article.article/${job.createdArticle!.id}`;
                              }}
                            >
                              View
                            </Button>
                          )}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

      {modalJobId && (
        <Suspense fallback={<div />}>
          <JobDetailModal jobId={modalJobId} onClose={() => setModalJobId(null)} />
        </Suspense>
      )}

              {/* Showing all jobs (pagination removed) */}
              <Box padding={4}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Typography>Showing {jobs.length} jobs</Typography>
                </Flex>
              </Box>
            </Box>
          )}
          <BrandingFooter />
          </Box>
      </Layouts.Content>
    </>
  );
};

export default HistoryPage;
