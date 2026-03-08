import client from '../api/client';
import { jobsApi } from '../api/jobs';

jest.mock('../api/client', () => ({
  plugin: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  apiGet: jest.fn(),
  apiPut: jest.fn(),
}));

describe('jobsApi', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('getOne', () => {
    it('calls plugin.get and returns data', async () => {
      const fakeResponse = { data: { data: { id: 42, articleTitle: 'Hello' } } };
      (client.plugin.get as jest.Mock).mockResolvedValue(fakeResponse);

      const job = await jobsApi.getOne(42);

      expect(client.plugin.get).toHaveBeenCalledWith('/jobs/42');
      expect(job).toEqual({ id: 42, articleTitle: 'Hello' });
    });

    it('throws when response is HTML or missing data', async () => {
      (client.plugin.get as jest.Mock).mockResolvedValue({ data: '<html></html>', status: 200 });

      await expect(jobsApi.getOne(1)).rejects.toThrow('Unexpected response when fetching job detail');
    });
  });

  describe('getAll', () => {
    it('calls plugin.get with pagination', async () => {
      const fakeResponse = { data: { data: [{ id: 1 }], meta: { pagination: {} } } };
      (client.plugin.get as jest.Mock).mockResolvedValue(fakeResponse);

      const res = await jobsApi.getAll({ page: 1, pageSize: 5 });

      expect(client.plugin.get).toHaveBeenCalledWith('/jobs', { params: { 'pagination[page]': 1, 'pagination[pageSize]': 5 } });
      expect(res).toEqual(fakeResponse.data);
    });
  });

  describe('mutations', () => {
    it('createArticle uses plugin.post', async () => {
      const fake = { data: { data: { articleId: 99 } } };
      (client.plugin.post as jest.Mock).mockResolvedValue(fake);

      const res = await jobsApi.createArticle(99);
      expect(client.plugin.post).toHaveBeenCalledWith('/jobs/99/create-article');
      expect(res).toEqual({ articleId: 99 });
    });

    it('retry/refresh/delete call plugin endpoints', async () => {
      const jobResp = { data: { data: { id: 5 } } };
      (client.plugin.post as jest.Mock).mockResolvedValue(jobResp);
      (client.plugin.delete as jest.Mock).mockResolvedValue({});

      const retried = await jobsApi.retry(5);
      expect(client.plugin.post).toHaveBeenCalledWith('/jobs/5/retry');
      expect(retried).toEqual({ id: 5 });

      const refreshed = await jobsApi.refresh(5);
      expect(client.plugin.post).toHaveBeenCalledWith('/jobs/5/refresh');
      expect(refreshed).toEqual({ id: 5 });

      await jobsApi.delete(5);
      expect(client.plugin.delete).toHaveBeenCalledWith('/jobs/5');
    });

    it('health calls plugin.get', async () => {
      const fake = { data: { status: 'ok' } };
      (client.plugin.get as jest.Mock).mockResolvedValue(fake);

      const res = await jobsApi.health();
      expect(client.plugin.get).toHaveBeenCalledWith('/health');
      expect(res).toEqual({ status: 'ok' });
    });
  });

  describe('getSummary', () => {
    it('prefers the summary endpoint when available (apiGet)', async () => {
      const summary = { total: 120, inProgress: 7, completed: 95, failed: 18 };
      (client.apiGet as jest.Mock).mockResolvedValueOnce({ data: summary });

      const res = await jobsApi.getSummary();

      expect(client.apiGet).toHaveBeenCalledWith('/plugins/ai-youtube-article/jobs/summary');
      expect(res).toEqual(summary);
    });

    it('prefers the summary endpoint via plugin.get fallback if apiGet fails', async () => {
      const summary = { total: 120, inProgress: 7, completed: 95, failed: 18 };
      (client.apiGet as jest.Mock).mockRejectedValueOnce(new Error('network'));
      (client.plugin.get as jest.Mock).mockResolvedValueOnce({ data: summary });

      const res = await jobsApi.getSummary();

      expect(client.plugin.get).toHaveBeenCalledWith('/jobs/summary');
      expect(res).toEqual(summary);
    });

  it('handles nested data from the summary endpoint (resp.data.data)', async () => {
    const summary = { total: 120, inProgress: 7, completed: 95, failed: 18 };
    (client.plugin.get as jest.Mock).mockResolvedValueOnce({ data: { data: summary } });

    const res = await jobsApi.getSummary();

    expect(client.plugin.get).toHaveBeenCalledWith('/jobs/summary');
    expect(res).toEqual(summary);
  });
    it('falls back to counting by status when summary missing (uses apiGet for per-status calls)', async () => {
      // summary endpoints fail
      (client.apiGet as jest.Mock).mockRejectedValueOnce(new Error('404'));
      (client.plugin.get as jest.Mock).mockRejectedValueOnce(new Error('404'));

      // processing
      (client.apiGet as jest.Mock).mockResolvedValueOnce({ data: { meta: { pagination: { total: 3 } } } });
      // pending
      (client.apiGet as jest.Mock).mockResolvedValueOnce({ data: { meta: { pagination: { total: 4 } } } });
      // completed
      (client.apiGet as jest.Mock).mockResolvedValueOnce({ data: { meta: { pagination: { total: 95 } } } });
      // failed
      (client.apiGet as jest.Mock).mockResolvedValueOnce({ data: { meta: { pagination: { total: 10 } } } });

      // total (all jobs)
      (client.apiGet as jest.Mock).mockResolvedValueOnce({ data: { meta: { pagination: { total: 112 } } } });

      const res = await jobsApi.getSummary();

      expect(res).toEqual({ total: 112, inProgress: 7, completed: 95, failed: 10, pending: 4, processing: 3 });

      // validate calls made for statuses (apiGet calls)
      expect((client.apiGet as jest.Mock).mock.calls[0][0]).toEqual('/plugins/ai-youtube-article/jobs');
      expect((client.apiGet as jest.Mock).mock.calls[0][1]).toEqual({ params: { status: 'processing', 'pagination[page]': 1, 'pagination[pageSize]': 1 } });
      expect((client.apiGet as jest.Mock).mock.calls[1][1]).toEqual({ params: { status: 'pending', 'pagination[page]': 1, 'pagination[pageSize]': 1 } });
      expect((client.apiGet as jest.Mock).mock.calls[2][1]).toEqual({ params: { status: 'completed', 'pagination[page]': 1, 'pagination[pageSize]': 1 } });
      expect((client.apiGet as jest.Mock).mock.calls[3][1]).toEqual({ params: { status: 'failed', 'pagination[page]': 1, 'pagination[pageSize]': 1 } });
    });
  });
});