import { normalizeJob } from '../utils/normalizeJob';

describe('normalizeJob', () => {
  test('maps flat shape to expected article fields', () => {
    const raw = {
      id: 1,
      title: 'Flat Title',
      excerpt: 'Flat Excerpt',
      body: 'Flat Body',
      status: 'completed',
      pythonJobId: 'uuid-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const normalized = normalizeJob(raw as any);
    expect(normalized.articleTitle).toBe('Flat Title');
    expect(normalized.articleSummary).toBe('Flat Excerpt');
    expect(normalized.articleContent).toBe('Flat Body');
    expect(normalized.pythonJobId).toBe('uuid-1');
  });

  test('maps nested data.* shape to expected article fields', () => {
    const raw = {
      id: 2,
      data: {
        headline: 'Nested Headline',
        summary: 'Nested Summary',
        article: 'Nested Article'
      },
      status: 'completed',
      job_id: 'uuid-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const normalized = normalizeJob(raw as any);
    expect(normalized.articleTitle).toBe('Nested Headline');
    expect(normalized.articleSummary).toBe('Nested Summary');
    expect(normalized.articleContent).toBe('Nested Article');
    expect(normalized.pythonJobId).toBe('uuid-2');
  });
});
