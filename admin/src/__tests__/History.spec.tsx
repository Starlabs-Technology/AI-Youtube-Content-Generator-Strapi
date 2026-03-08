import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch client
const mockGet = jest.fn();
jest.mock('@strapi/strapi/admin', () => ({
  ...jest.requireActual('@strapi/strapi/admin'),
  useFetchClient: () => ({ get: mockGet }),
  Layouts: { Header: ({ children }: any) => <div>{children}</div>, Content: ({ children }: any) => <div>{children}</div> },
}));

const get = mockGet;

// Import component after mocking
import HistoryPage from '../pages/History';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';

describe('History (no pagination)', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('fetches all jobs using the total counts and renders them', async () => {
    // Prepare counts responses for statuses (1 each -> total 4)
    get.mockImplementation(async (url, options) => {
      const status = options?.params?.status;

      if (status === 'pending') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 1 } } } };
      if (status === 'processing') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 1 } } } };
      if (status === 'completed') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 1 } } } };
      if (status === 'failed') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 1 } } } };

      // Jobs fetch - return all 4 items at once
      return {
        data: {
          data: [
            { id: 1, youtubeUrl: 'u1', status: 'completed', createdAt: new Date().toISOString() },
            { id: 2, youtubeUrl: 'u2', status: 'completed', createdAt: new Date().toISOString() },
            { id: 3, youtubeUrl: 'u3', status: 'completed', createdAt: new Date().toISOString() },
            { id: 4, youtubeUrl: 'u4', status: 'completed', createdAt: new Date().toISOString() },
          ],
          meta: { pagination: { page: 1, pageSize: 4, pageCount: 1, total: 4 } },
        },
      };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Expect that a jobs fetch was made with pageSize equal to the total (4)
    await waitFor(() => expect(get).toHaveBeenCalledWith('/ai-youtube-article/jobs', expect.objectContaining({ params: expect.objectContaining({ 'pagination[pageSize]': 4 }) })));

    // Ensure we also called out to subsequent pages if pageCount > 1
    // (Not necessary for this test data, but validates multi-page fetching behavior.)
    // Note: mock implementation will only return one response for the jobs fetch in this test.
    

    // And UI should render all rows
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();
    });

    // And the summary shows the count
    expect(screen.getByText('Showing 4 jobs')).toBeInTheDocument();
  });

  test('deduplicates jobs across pages when API returns overlapping pages', async () => {
    get.mockImplementation(async (url, options) => {
      const status = options?.params?.status;
      const page = options?.params?.['pagination[page]'];

      if (status === 'pending') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 0 } } } };
      if (status === 'processing') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 0 } } } };
      if (status === 'completed') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 6 } } } };
      if (status === 'failed') return { data: { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 0 } } } };

      if (!page || page === 1) {
        return { data: { data: [
          { id: 1, youtubeUrl: 'u1', status: 'completed', createdAt: new Date().toISOString() },
          { id: 2, youtubeUrl: 'u2', status: 'completed', createdAt: new Date().toISOString() },
          { id: 3, youtubeUrl: 'u3', status: 'completed', createdAt: new Date().toISOString() },
        ], meta: { pagination: { page: 1, pageSize: 3, pageCount: 3, total: 6 } } } };
      }

      if (page === 2) {
        return { data: { data: [
          { id: 3, youtubeUrl: 'u3', status: 'completed', createdAt: new Date().toISOString() },
          { id: 4, youtubeUrl: 'u4', status: 'completed', createdAt: new Date().toISOString() },
        ], meta: { pagination: { page: 2, pageSize: 3, pageCount: 3, total: 6 } } } };
      }

      if (page === 3) {
        return { data: { data: [
          { id: 4, youtubeUrl: 'u4', status: 'completed', createdAt: new Date().toISOString() },
          { id: 5, youtubeUrl: 'u5', status: 'completed', createdAt: new Date().toISOString() },
          { id: 6, youtubeUrl: 'u6', status: 'completed', createdAt: new Date().toISOString() },
        ], meta: { pagination: { page: 3, pageSize: 3, pageCount: 3, total: 6 } } } };
      }

      return { data: { data: [], meta: { pagination: { page: page || 1, pageSize: 3, pageCount: 3, total: 6 } } } };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('Showing 6 jobs')).toBeInTheDocument());

    expect(screen.getAllByText('#3').length).toBe(1);
    expect(screen.getAllByText('#4').length).toBe(1);
  });
});
