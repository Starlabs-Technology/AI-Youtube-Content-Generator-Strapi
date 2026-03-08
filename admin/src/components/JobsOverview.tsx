import React, { useState, Suspense } from 'react';
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
  Link,
  ProgressBar,
} from '@strapi/design-system';
import { ArrowRight, Plus, ExternalLink, Eye } from '@strapi/icons';
const JobDetailModal = React.lazy(() => import('./JobDetailModal').then((mod) => ({ default: (mod as any).JobDetailModal })));
import { useNavigate } from 'react-router-dom';
import type { Job } from '../api/types';
import { useJobs } from '../hooks/useJobs';

interface JobsOverviewProps {
  limit?: number;
}

export const JobsOverview: React.FC<JobsOverviewProps> = ({ limit = 5 }) => {
  const navigate = useNavigate();
  const [modalJobId, setModalJobId] = useState<number | null>(null);
  
  // Use React Query hook - auto-refreshes when jobs are active
  const { data, isLoading } = useJobs({ pageSize: limit });
  const jobs = data?.data || [];

  if (isLoading) {
    return (
      <Box
        background="neutral0"
        hasRadius
        shadow="tableShadow"
        padding={6}
      >
        <Flex direction="column" gap={3}>
          <Box background="neutral150" height="32px" hasRadius width="40%" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} background="neutral100" height="48px" hasRadius />
          ))}
        </Flex>
      </Box>
    );
  }

  if (jobs.length === 0) {
    return (
      <Box
        background="neutral0"
        hasRadius
        shadow="tableShadow"
        padding={8}
      >
        <EmptyStateLayout
          icon={<Plus width="48px" height="48px" />}
          content="No jobs yet. Create your first transcription job to get started."
        />
      </Box>
    );
  }

  return (
    <Box
      background="neutral0"
      hasRadius
      shadow="tableShadow"
      padding={0}
      style={{ overflowX: 'auto' }}
    >
      <Box padding={6} paddingBottom={4}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="beta" fontWeight="bold">
            Recent Jobs
          </Typography>
          <Button
            variant="tertiary"
            size="S"
            endIcon={<ArrowRight />}
            onClick={() => navigate('/plugins/ai-youtube-article/history')}
          >
            View All
          </Button>
        </Flex>
      </Box>
      
      <Table colCount={7} rowCount={jobs.length}>
        <Thead>
          <Tr>
            <Th><Typography variant="sigma">ID</Typography></Th>
            <Th><Typography variant="sigma">YouTube</Typography></Th>
            <Th><Typography variant="sigma">Title</Typography></Th>
            <Th><Typography variant="sigma">Status</Typography></Th>
            <Th><Typography variant="sigma">Progress</Typography></Th>
            <Th><Typography variant="sigma">Created</Typography></Th>
            <Th><Typography variant="sigma">Actions</Typography></Th>
          </Tr>
        </Thead>
        <Tbody>
          {jobs.map((job) => (
            <Tr
              key={job.id}
              style={{
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f6f6f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Td>
                <Typography variant="omega" fontWeight="semiBold">
                  #{job.id}
                </Typography>
              </Td>
              <Td>
                <Link
                  href={job.youtubeUrl}
                  isExternal
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                  }}
                  aria-label="Open YouTube video"
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
                {job.status === 'completed' && job.createdArticle ? (
                  <Link
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      // Prefer opening the created article in Content Manager
                      setModalJobId(job.id);
                    }}
                    style={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      maxWidth: '300px',
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
                      maxWidth: '300px',
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
                )} 
              </Td>
              <Td>
                <Badge
                  variant={
                    job.status === 'completed'
                      ? 'success'
                      : job.status === 'failed'
                      ? 'danger'
                      : job.status === 'processing'
                      ? 'primary'
                      : 'secondary'
                  }
                  size="S"
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
              </Td>
              <Td>
                <Box style={{ minWidth: '120px' }}>
                  {job.status === 'processing' || job.status === 'pending' ? (
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral600">
                        {job.progress || 0}%
                      </Typography>
                      <ProgressBar value={job.progress || 0} />
                    </Flex>
                  ) : (
                    <Typography variant="omega" textColor="neutral600">
                      {job.status === 'completed' ? '100%' : job.status === 'failed' ? 'Failed' : '-'}
                    </Typography>
                  )}
                </Box>
              </Td>
              <Td>
                <Typography variant="omega" textColor="neutral600">
                  {getRelativeTime(job.createdAt)}
                </Typography>
              </Td>
              <Td>
                {job.createdArticle && (
                  <Button
                    variant="tertiary"
                    size="S"
                    startIcon={<Eye />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setModalJobId(job.id);
                    }}
                  >
                    View
                  </Button>
                )}
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
    </Box>

  );
};

// Helper function to get relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};
