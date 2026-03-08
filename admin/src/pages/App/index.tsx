import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import pluginId from '../../pluginId';
import HomePage from '../Home';
import HistoryPage from '../History';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="history" element={<HistoryPage />} />
      </Routes>
    </QueryClientProvider>
  );
};

export default App;
