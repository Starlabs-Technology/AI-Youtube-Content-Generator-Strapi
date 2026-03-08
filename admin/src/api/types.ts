export interface Job {
  id: number;
  youtubeUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  pythonJobId: string | null;
  articleTitle: string | null;
  articleContent: string | null;
  articleSummary: string | null;
  errorMessage: string | null;
  errorDetails: any;
  createdArticle: { id: number; title: string } | null;
  metadata: {
    duration_seconds?: number;
    language?: string;
    processing_time_seconds?: number;
    processing_time?: number;
    model_used?: string;
    modelUsed?: string;
    source_url?: string;
    sourceUrl?: string;
  } | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  youtubeUrl: string;
}

export interface CreateJobResponse {
  data: Job;
}

export interface JobListResponse {
  data: Job[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface PluginSettings {
  pythonServiceUrl: string;
  pythonApiKey: string;
  pollingInterval: number;
  timeout: number;
}

export interface SettingsResponse {
  data: PluginSettings;
}

export interface UpdateSettingsRequest {
  pythonServiceUrl: string;
  pythonApiKey: string;
  pollingInterval?: number;
  timeout?: number;
}
