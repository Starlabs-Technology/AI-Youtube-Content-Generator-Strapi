import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsApi } from '../api/jobs';
import type { PluginSettings, UpdateSettingsRequest } from '../api/types';

export function useSettings() {
  return useQuery('settings', () => settingsApi.getSettings());
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation(
    (settings: UpdateSettingsRequest) => settingsApi.updateSettings(settings),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('settings', data);
      },
    }
  );
}

export function useTestConnection() {
  return useMutation(() => settingsApi.testConnection());
}

export function useEnvInfo() {
  return useQuery('envInfo', () => settingsApi.getEnvInfo());
}
