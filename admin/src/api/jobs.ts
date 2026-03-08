import client from './client';
import type {
  Job,
  CreateJobRequest,
  CreateJobResponse,
  JobListResponse,
  PluginSettings,
  UpdateSettingsRequest,
} from './types';

// All calls use the admin-prefixed client methods (client.get/post/delete)
// which resolve to /admin/plugins/ai-youtube-article/... and are authenticated
// via the Strapi admin session cookie automatically.

export const jobsApi = {
  create: async (data: CreateJobRequest): Promise<Job> => {
    const response = await client.post<CreateJobResponse>('/jobs', data);
    return response.data.data;
  },

  getOne: async (id: number): Promise<Job> => {
    const response = await client.get(`/jobs/${id}`);
    return response.data.data;
  },

  getAll: async (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
    _limit?: number;
    _start?: number;
  }): Promise<JobListResponse> => {
    const queryParams: any = {};
    if (params?.status !== undefined) queryParams.status = params.status;
    if (params?.page !== undefined) queryParams['pagination[page]'] = params.page;
    if (params?.pageSize !== undefined) queryParams['pagination[pageSize]'] = params.pageSize;
    if (params?._limit !== undefined) queryParams._limit = params._limit;
    if (params?._start !== undefined) queryParams._start = params._start;

    const response = await client.get('/jobs', { params: queryParams });
    return response.data;
  },

  createArticle: async (id: number): Promise<{ articleId: number }> => {
    const response = await client.post(`/jobs/${id}/create-article`);
    return response.data.data;
  },

  retry: async (id: number): Promise<Job> => {
    const response = await client.post<CreateJobResponse>(`/jobs/${id}/retry`);
    return response.data.data;
  },

  refresh: async (id: number): Promise<Job> => {
    const response = await client.post<CreateJobResponse>(`/jobs/${id}/refresh`);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/jobs/${id}`);
  },

  health: async (): Promise<any> => {
    const response = await client.get('/health');
    return response.data;
  },

  getSummary: async (): Promise<{
    total: number;
    inProgress: number;
    completed: number;
    failed: number;
    pending?: number;
    processing?: number;
  }> => {
    // Try dedicated summary endpoint first
    try {
      const resp = await client.get('/jobs/summary');
      const candidate = resp?.data?.data ?? resp?.data;
      if (candidate && typeof candidate.total === 'number') {
        return candidate;
      }
    } catch {
      // fall through to fallback
    }

    // Fallback: count per status
    const statuses = ['processing', 'pending', 'completed', 'failed'];
    const calls = statuses.map((s) =>
      client.get('/jobs', {
        params: { status: s, 'pagination[page]': 1, 'pagination[pageSize]': 1 },
      }),
    );
    const results = await Promise.allSettled(calls);
    const counts: any = { inProgress: 0, completed: 0, failed: 0, pending: 0, processing: 0 };

    results.forEach((r, idx) => {
      const status = statuses[idx];
      if (r.status === 'fulfilled') {
        const total = (r as any).value?.data?.meta?.pagination?.total || 0;
        counts[status] = total;
      }
    });
    counts.inProgress = counts.pending + counts.processing;

    try {
      const all = await client.get('/jobs', {
        params: { 'pagination[page]': 1, 'pagination[pageSize]': 1 },
      });
      const total =
        all?.data?.meta?.pagination?.total ||
        counts.completed + counts.failed + counts.inProgress;
      return { total, ...counts };
    } catch {
      return {
        total: counts.completed + counts.failed + counts.inProgress,
        ...counts,
      };
    }
  },
};

export const settingsApi = {
  getSettings: async (): Promise<PluginSettings> => {
    const response = await client.get('/settings');
    return response.data.data;
  },

  updateSettings: async (settings: UpdateSettingsRequest): Promise<PluginSettings> => {
    const response = await client.put('/settings', settings);
    return response.data.data;
  },

  testConnection: async (): Promise<any> => {
    const response = await client.post('/test-connection');
    return response.data;
  },

  getEnvInfo: async (): Promise<any> => {
    const response = await client.get('/settings/env-info');
    return response.data.data;
  },
};
