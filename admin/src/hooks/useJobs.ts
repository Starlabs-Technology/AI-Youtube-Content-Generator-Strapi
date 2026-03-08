import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { jobsApi } from '../api/jobs';
import type { Job, JobListResponse } from '../api/types';
import { normalizeJob } from '../utils/normalizeJob';

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation(
    (youtubeUrl: string) => jobsApi.create({ youtubeUrl }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

export function useJob(jobId: number | null) {
  const queryClient = useQueryClient();

  // Attempt to compute placeholder data from caches so the UI can show cached values immediately
  const placeholder = React.useMemo(() => {
    if (!jobId) return null;

    // Prefer an existing single job cache
    const single = queryClient.getQueryData(['job', jobId]) as any | undefined;
    if (single) return normalizeJob(single);

    // Otherwise, try to find the job in the jobs list cache
    const list = queryClient.getQueryData(['jobs', {}]) as any | undefined;
    const arr = list?.data || [];
    const match = arr.find((j: any) => j.id === jobId) || null;
    return normalizeJob(match);
  }, [jobId, queryClient]);

  return useQuery<Job | null>(
    ['job', jobId],
    () => jobsApi.getOne(jobId!).then((raw) => normalizeJob(raw)),
    {
      enabled: !!jobId,
      // Provide placeholderData so consumers can render cached values while the network request completes
      placeholderData: placeholder ?? undefined,
      // Avoid carrying previous job's data when the query key (jobId) changes — show loading/placeholder instead
      keepPreviousData: false,
      refetchInterval: (data: any) => {
        if (!data) return false;
        const hasArticle = !!(data.articleTitle || data.articleContent || data.articleSummary || data.body || data.title);

        // If the job has failed, stop polling
        if (data.status === 'failed') return false;

        // If completed and we already have article fields, stop polling
        if (data.status === 'completed' && hasArticle) return false;

        // If completed but missing article fields, continue polling briefly to pick up updates
        if (data.status === 'completed' && !hasArticle) return 5000;

        // Job is pending or processing — keep polling
        return 5000;
      },
    }
  );
}

export function useJobs(filters?: { status?: string; pageSize?: number }) {
  return useQuery<JobListResponse>(['jobs', filters], () => jobsApi.getAll(filters), {
    refetchInterval: (data) => {
      const jobs = data?.data;
      if (!jobs || jobs.length === 0) return false;

      const hasActiveJobs = jobs.some(
        (job) => job.status === 'pending' || job.status === 'processing'
      );

      return hasActiveJobs ? 5000 : false;
    },
  });
}

export function useRefreshJob() {
  const queryClient = useQueryClient();
  return useMutation(
    (id: number) => jobsApi.refresh(id),
    {
      onSuccess: (_data, id) => {
        // Invalidate relevant caches so modal and list see fresh data
        queryClient.invalidateQueries(['job', id]);
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation(
    (jobId: number) => jobsApi.createArticle(jobId),
    {
      onSuccess: (_, jobId) => {
        queryClient.invalidateQueries(['job', jobId]);
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation(
    (jobId: number) => jobsApi.retry(jobId),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['job', data.id], data);
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation(
    (jobId: number) => jobsApi.delete(jobId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
      },
    }
  );
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export function useJobStats() {
  return useQuery<JobStats>(
    ['jobStats'],
    async () => {
      const [pendingRes, processingRes, completedRes, failedRes] = await Promise.all([
        jobsApi.getAll({ status: 'pending' }),
        jobsApi.getAll({ status: 'processing' }),
        jobsApi.getAll({ status: 'completed' }),
        jobsApi.getAll({ status: 'failed' }),
      ]);

      const pending = pendingRes?.meta?.pagination?.total || 0;
      const processing = processingRes?.meta?.pagination?.total || 0;
      const completed = completedRes?.meta?.pagination?.total || 0;
      const failed = failedRes?.meta?.pagination?.total || 0;

      return {
        total: pending + processing + completed + failed,
        pending,
        processing,
        completed,
        failed,
      };
    },
    {
      refetchInterval: (data) => {
        // Poll every 5 seconds if there are active jobs
        if (data && (data.pending > 0 || data.processing > 0)) {
          return 5000;
        }
        return false;
      },
    }
  );
}
