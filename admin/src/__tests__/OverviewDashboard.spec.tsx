import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../api/jobs', () => ({
  jobsApi: {
    getSummary: jest.fn(),
  },
}));

const { jobsApi } = require('../api/jobs');

import { OverviewDashboard } from '../components/OverviewDashboard';
import { QueryClient, QueryClientProvider } from 'react-query';

describe('OverviewDashboard', () => {
  afterEach(() => jest.resetAllMocks());

  it('renders counts from getSummary', async () => {
    (jobsApi.getSummary as jest.Mock).mockResolvedValue({ total: 120, inProgress: 15, completed: 95, failed: 10 });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <OverviewDashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Total Jobs')).toBeInTheDocument();
    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(await screen.findByText('15')).toBeInTheDocument();
    expect(await screen.findByText('95')).toBeInTheDocument();
    expect(await screen.findByText('10')).toBeInTheDocument();
  });
});