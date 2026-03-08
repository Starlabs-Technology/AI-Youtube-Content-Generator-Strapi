import React from 'react';
import { Badge, ProgressBar, Box, Typography, Flex, Alert } from '@strapi/design-system';
import { Check, Cross, Clock, Loader } from '@strapi/icons';
import type { Job } from '../api/types';

interface JobStatusProps {
  job: Job;
}

const STATUS_VARIANTS = {
  pending: 'secondary',
  processing: 'primary',
  completed: 'success',
  failed: 'danger',
} as const;

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const STATUS_ICONS = {
  pending: Clock,
  processing: Loader,
  completed: Check,
  failed: Cross,
};

export const JobStatus: React.FC<JobStatusProps> = ({ job }) => {
  const StatusIcon = STATUS_ICONS[job.status];

  return (
    <Box
      background="neutral0"
      hasRadius
      shadow="tableShadow"
      padding={8}
    >
      <Flex direction="column" alignItems="stretch" gap={6}>
        <Flex direction="column" alignItems="stretch" gap={3}>
          <Typography variant="pi" textColor="neutral600" fontWeight="semiBold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Job Status
          </Typography>
          <Flex alignItems="center" gap={3}>
            <Box 
              color={`${STATUS_VARIANTS[job.status]}600`}
              style={{ 
                display: 'flex',
                padding: '8px',
                background: `var(--strapi-color-${STATUS_VARIANTS[job.status]}100)`,
                borderRadius: '4px'
              }}
            >
              <StatusIcon width="20px" height="20px" />
            </Box>
            <Badge variant={STATUS_VARIANTS[job.status]} size="M">
              {STATUS_LABELS[job.status]}
            </Badge>
            {job.status === 'processing' && job.progress !== undefined && (
              <Typography variant="beta" fontWeight="bold" textColor="primary600">
                {job.progress}%
              </Typography>
            )}
          </Flex>
        </Flex>
        
        {job.status === 'processing' && job.progress !== undefined && (
          <Box>
            <ProgressBar value={job.progress} size="M" />
          </Box>
        )}

        {job.errorMessage && (
          <Alert variant="danger" title="Error" closeLabel="Close">
            {job.errorMessage}
          </Alert>
        )}
      </Flex>
    </Box>
  );
};
