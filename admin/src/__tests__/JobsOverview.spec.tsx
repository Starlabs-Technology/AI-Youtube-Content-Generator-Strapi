import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock Strapi fetch client
jest.mock('@strapi/strapi/admin', () => ({
  useFetchClient: () => ({
    get: jest.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 42,
            jobId: 42,
            title: 'Test Article',
            excerpt: 'Summary',
            body: 'Full article body here',
            youtubeUrl: 'https://youtu.be/abc123',
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }),
  }),
  useNotification: () => ({ toggleNotification: jest.fn() }),
  Layouts: { Header: () => null, Content: ({ children }: any) => children },
}));

// Prevent loading @strapi/admin internals via api/client by mocking the client module
jest.mock('../api/client', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    plugin: { get: jest.fn(), post: jest.fn() },
  },
}));

// Mock icons to avoid styled-components/theme dependency in unit tests
jest.mock('@strapi/icons', () => ({
  ArrowRight: () => (<span />),
  Plus: () => (<span />),
  ExternalLink: () => (<span />),
  Eye: () => (<span />),
  Check: () => (<span />),
  Cross: () => (<span />),
  Clock: () => (<span />),
  Loader: () => (<span />),
}));

import { JobsOverview } from '../components/JobsOverview';

describe('JobsOverview', () => {
  it('populates the jobs query cache after fetching', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <JobsOverview limit={5} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for the jobs cache to be populated by the component
    await waitFor(() => expect(queryClient.getQueryData(['jobs', {}])).toBeDefined());

    const jobsCache = queryClient.getQueryData(['jobs', {}]) as any;
    expect(jobsCache).toBeDefined();
    expect(Array.isArray(jobsCache.data)).toBe(true);
    expect(jobsCache.data[0].id).toEqual(42);
    expect(jobsCache.data[0].title || jobsCache.data[0].articleTitle).toBeTruthy();

    // The jobs table should render a single YouTube link icon per row
    const youtubeLinks = screen.getAllByLabelText('Open YouTube video');
    expect(youtubeLinks.length).toBeGreaterThanOrEqual(1);
    // Ensure at least one of the rendered links points to the expected URL
    expect(youtubeLinks[0]).toHaveAttribute('href', 'https://youtu.be/abc123');
  });
});
