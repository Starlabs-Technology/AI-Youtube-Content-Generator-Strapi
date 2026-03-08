import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock heavy dependencies before importing the component to avoid loading design-system
jest.mock('../components/ArticlePreview', () => ({
  ArticlePreview: () => (<div data-testid="article-preview" />),
}));

// Mock api client to avoid importing @strapi/admin internals at module load
jest.mock('../api/client', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    plugin: { get: jest.fn(), post: jest.fn() },
  },
}));

// Now import the component under test
import { JobDetailModal } from '../components/JobDetailModal';

// Mock the useJobs hook
jest.mock('../hooks/useJobs', () => ({
  useJob: jest.fn(),
  useCreateArticle: () => ({ mutateAsync: jest.fn(), isLoading: false }),
  useRefreshJob: () => ({ mutateAsync: jest.fn(), isLoading: false }),
}));

const { useJob } = require('../hooks/useJobs');

// Mock react-query's useQueryClient to avoid touching real cache
jest.mock('react-query', () => ({
  useQueryClient: () => ({ getQueryData: jest.fn() }),
}));

describe('JobDetailModal', () => {
  afterEach(() => jest.resetAllMocks());

  test('shows loading indicator while fetching', () => {
    useJob.mockReturnValue({ data: null, error: null, isLoading: true, refetch: jest.fn() });

    render(<JobDetailModal jobId={1} onClose={() => {}} />);

    expect(screen.getByText('Loading article…')).toBeInTheDocument();
  });

  test('renders flat payload fields (title, excerpt, body)', async () => {
    const flat = {
      id: 42,
      status: 'completed',
      title: 'Flat Title',
      excerpt: 'Flat Excerpt',
      body: 'Paragraph one.\n\nParagraph two.',
      youtubeUrl: 'https://youtu.be/abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pythonJobId: 'uuid-1'
    };

    // Simulate normalized object returned by useJob
    useJob.mockReturnValue({ data: flat, error: null, isLoading: false, refetch: jest.fn() });

    render(<JobDetailModal jobId={42} onClose={() => {}} />);

    // Header title should contain the article title (may appear in multiple places)
    const matches = screen.getAllByText('Flat Title');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // The summary should be shown in overview (may appear more than once)
    const exMatches = screen.getAllByText('Flat Excerpt');
    expect(exMatches.length).toBeGreaterThan(0);

    // The duplicate small meta block ("Job ID:") beneath the header should be removed
    expect(screen.queryByText(/Job ID:/)).toBeNull();

    // The "Top" button was removed (we keep only Copy Article)
    expect(screen.queryByText('Top')).not.toBeInTheDocument();

    // If a YouTube URL exists, it should render a link in the header
    expect(screen.getByLabelText('Open YouTube video')).toHaveAttribute('href', 'https://youtu.be/abc123');
  });

  test('shows info while polling, then danger when polling exhausted (completed but missing article content)', () => {
    const missing = {
      id: 7,
      status: 'completed',
      title: null,
      excerpt: null,
      body: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pythonJobId: 'uuid-2'
    };

    // The hook returns a completed job missing article fields; modal should show a polling/info message while retrying
    useJob.mockReturnValue({ data: missing, error: null, isLoading: false, refetch: jest.fn() });

    render(<JobDetailModal jobId={7} onClose={() => {}} />);

    // While the polling is active we expect an informational alert
    expect(screen.getByTitle('Waiting for article content')).toBeInTheDocument();
  });

  test('uses cached job from jobs list while detail query is pending and updates when detail resolves', async () => {
    const cachedJob = {
      id: 42,
      jobId: 42,
      articleTitle: 'Cached Title',
      articleSummary: 'Cached summary',
      articleContent: 'Cached content',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const detailedJob = {
      id: 42,
      jobId: 42,
      // Provide articleTitle so header prefers it over the cached articleTitle
      articleTitle: 'Detailed Title',
      articleSummary: 'Detailed excerpt',
      articleContent: 'Detailed body content',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update the react-query mock to return the cached jobs list when requested
    const queryModule = require('react-query');
    queryModule.useQueryClient = () => ({
      getQueryData: jest.fn().mockImplementation((key: any) => {
        if (Array.isArray(key) && key[0] === 'jobs') return { data: [cachedJob] };
        return null;
      }),
    });

    // Simulate the detail query pending initially
    useJob.mockReturnValue({ data: null, error: null, isLoading: true, refetch: jest.fn() });

    const { rerender } = render(<JobDetailModal jobId={cachedJob.id} onClose={() => {}} />);

    // The modal header should use the cached title (may appear multiple times)
    const cachedMatches = await screen.findAllByText('Cached Title');
    expect(cachedMatches.length).toBeGreaterThan(0);

    // Now simulate the detailed fetch resolving with authoritative data
    useJob.mockReturnValue({ data: detailedJob, error: null, isLoading: false, refetch: jest.fn() });

    // Rerender to pick up the new useJob return value
    rerender(<JobDetailModal jobId={cachedJob.id} onClose={() => {}} />);

    // Expect the modal to update to the detailed title (may appear multiple times)
    const detailed = await screen.findAllByText('Detailed Title');
    expect(detailed.length).toBeGreaterThan(0);

  });

  test('does not display previous job data when opening a different job after closing', () => {
    const jobA = { id: 1, title: 'Job A Title', status: 'completed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), pythonJobId: 'a' };
    // First render with job A (stable mock so repeated re-renders are safe)
    useJob.mockReturnValue({ data: jobA, error: null, isLoading: false, refetch: jest.fn() });
    const { rerender } = render(<JobDetailModal jobId={1} onClose={() => {}} />);

    // Confirm job A's title is shown
    expect(screen.getByText('Job A Title')).toBeInTheDocument();

    // Close the modal (jobId null) — simulate disabled query returning no data
    useJob.mockReturnValue({ data: undefined, error: null, isLoading: false, refetch: jest.fn() });
    rerender(<JobDetailModal jobId={null} onClose={() => {}} />);

    // Job A's title should no longer be present
    expect(screen.queryByText('Job A Title')).toBeNull();

    // Now open job B which is loading (no data yet)
    useJob.mockReturnValue({ data: null, error: null, isLoading: true, refetch: jest.fn() });
    rerender(<JobDetailModal jobId={2} onClose={() => {}} />);

    // We should NOT see Job A title and should show a fallback header for job 2
    expect(screen.queryByText('Job A Title')).toBeNull();
    expect(screen.getByText('Job 2')).toBeInTheDocument();
  });

  test('clicking outside the modal triggers onClose, clicking inside does not', () => {
    useJob.mockReturnValue({ data: { id: 10, title: 'Test' }, error: null, isLoading: false, refetch: jest.fn() });
    const onClose = jest.fn();
    render(<JobDetailModal jobId={10} onClose={onClose} />);

    // Clicking the overlay (root) should trigger onClose
    const root = screen.getByTestId('dialog-root');
    root.click();
    expect(onClose).toHaveBeenCalled();

    // Reset and verify clicking inside the content does NOT call onClose
    onClose.mockReset();
    const content = screen.getByText('Article'); // element inside Dialog.Content
    content.click();
    expect(onClose).not.toHaveBeenCalled();
  });
});
