import React, { useState } from 'react';
import { 
  Page, 
  Layouts,
  useFetchClient,
  useNotification,
} from '@strapi/strapi/admin';
import { 
  Box, 
  Button, 
  Divider,
  Field,
  Flex, 
  Grid,
  Tabs,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { Check, Play } from '@strapi/icons';
import { PluginHeader } from '../../components/PluginHeader';
import { BrandingFooter } from '../../components/BrandingFooter';

const SettingsPage = () => {
  const { get, put, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [settings, setSettings] = useState({
    apifyApiToken: '',
    apifyActorId: '',
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    pollingInterval: 5000,
  });

  // Load settings
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await get('/ai-youtube-article/settings');
        setSettings(data);
      } catch (error) {
        toggleNotification({
          type: 'danger',
          message: 'Failed to load settings',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [get, toggleNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await put('/ai-youtube-article/settings', settings);
      
      toggleNotification({
        type: 'success',
        message: 'Settings saved successfully',
      });
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setSettings({
      ...settings,
      [field]: field === 'pollingInterval' ? parseInt(value) || 0 : value,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);

    try {
      // Save settings first before testing
      await put('/ai-youtube-article/settings', settings);

      const response = await post('/ai-youtube-article/test-connection');
      
      const { data } = response;
      if (data.success) {
        const services = data.services;
        const msg = services
          ? `Settings saved — Apify: ${services.apify?.message || '?'} | Gemini: ${services.gemini?.message || '?'}`
          : data.message || 'Settings saved & connection successful';
        toggleNotification({ type: 'success', message: msg });
      } else {
        toggleNotification({
          type: 'warning',
          message: data.message || 'Settings saved but connection test failed',
        });
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        'Connection test failed — check your API keys in Settings';
      toggleNotification({
        type: 'danger',
        message: msg,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Page.Loading />
    );
  }

  return (
    <Page.Main>
      <Page.Title>AI YouTube Article - Configuration</Page.Title>
      
      <PluginHeader
        title="Plugin Settings"
        subtitle="Configure Apify transcript scraper and Gemini AI content generation"
      />
      
      <Layouts.Content>
        <Box marginTop={6}>
        <Box 
          background="neutral0"
          hasRadius
          shadow="tableShadow"
        >
          <Tabs.Root defaultValue="connection">
            <Tabs.List aria-label="Settings tabs">
              <Tabs.Trigger value="connection">Connection</Tabs.Trigger>
              <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
            </Tabs.List>

            <Divider />

            <form onSubmit={handleSubmit}>
              {/* Connection Tab */}
              <Tabs.Content value="connection">
                <Box padding={8}>
                  <Flex direction="column" alignItems="stretch" gap={6}>
                    {/* Apify Section */}
                    <Flex direction="column" alignItems="stretch" gap={2}>
                      <Typography variant="beta" fontWeight="bold">
                        Apify — Transcript Scraper
                      </Typography>
                      <Typography variant="omega" textColor="neutral600">
                        Apify runs the YouTube Transcript scraper to fetch video captions.
                      </Typography>
                    </Flex>

                    <Grid.Root gap={5}>
                      <Grid.Item col={8} s={12} xs={12}>
                        <Field.Root
                          name="apifyApiToken"
                          required
                        >
                          <Field.Label>Apify API Token</Field.Label>
                          <TextInput
                            type="password"
                            value={settings.apifyApiToken}
                            onChange={handleChange('apifyApiToken')}
                            placeholder="apify_api_..."
                            size="M"
                          />
                          <Field.Hint>
                            Your Apify API token. Find it at https://console.apify.com/account#/integrations
                          </Field.Hint>
                        </Field.Root>
                      </Grid.Item>

                      <Grid.Item col={8} s={12} xs={12}>
                        <Field.Root name="apifyActorId">
                          <Field.Label>Apify Actor ID</Field.Label>
                          <TextInput
                            value={settings.apifyActorId}
                            onChange={handleChange('apifyActorId')}
                            placeholder="1s7eXiaukVuOr4Ueg"
                            size="M"
                          />
                          <Field.Hint>
                            The ID of the YouTube Transcript scraper actor. Defaults to the recommended actor if left empty.
                          </Field.Hint>
                        </Field.Root>
                      </Grid.Item>
                    </Grid.Root>

                    <Divider />

                    {/* Gemini Section */}
                    <Flex direction="column" alignItems="stretch" gap={2}>
                      <Typography variant="beta" fontWeight="bold">
                        Google Gemini — Content Generation
                      </Typography>
                      <Typography variant="omega" textColor="neutral600">
                        Gemini AI generates articles from the scraped transcript.
                      </Typography>
                    </Flex>

                    <Grid.Root gap={5}>
                      <Grid.Item col={8} s={12} xs={12}>
                        <Field.Root
                          name="geminiApiKey"
                          required
                        >
                          <Field.Label>Gemini API Key</Field.Label>
                          <TextInput
                            type="password"
                            value={settings.geminiApiKey}
                            onChange={handleChange('geminiApiKey')}
                            placeholder="AIzaSy..."
                            size="M"
                          />
                          <Field.Hint>
                            Your Google AI Studio API key. Get one at https://aistudio.google.com/app/apikey
                          </Field.Hint>
                        </Field.Root>
                      </Grid.Item>

                      <Grid.Item col={8} s={12} xs={12}>
                        <Field.Root name="geminiModel">
                          <Field.Label>Gemini Model</Field.Label>
                          <TextInput
                            value={settings.geminiModel}
                            onChange={handleChange('geminiModel')}
                            placeholder="gemini-2.0-flash"
                            size="M"
                          />
                          <Field.Hint>
                            The Gemini model to use for article generation. Default: gemini-2.0-flash
                          </Field.Hint>
                        </Field.Root>
                      </Grid.Item>
                    </Grid.Root>

                    {/* Test Connection Button */}
                    <Box paddingTop={4}>
                      <Button
                        onClick={handleTestConnection}
                        loading={isTesting}
                        disabled={!settings.apifyApiToken || !settings.geminiApiKey || isTesting}
                        variant="secondary"
                        size="L"
                        startIcon={<Play />}
                      >
                        Test Connection
                      </Button>
                    </Box>
                  </Flex>
                </Box>
              </Tabs.Content>

              {/* Performance Tab */}
              <Tabs.Content value="performance">
                <Box padding={8}>
                  <Flex direction="column" alignItems="stretch" gap={6}>
                    <Flex direction="column" alignItems="stretch" gap={2}>
                      <Typography variant="beta" fontWeight="bold">
                        Performance Settings
                      </Typography>
                      <Typography variant="omega" textColor="neutral600">
                        Adjust how frequently the plugin checks for job status updates.
                      </Typography>
                    </Flex>

                    <Grid.Root gap={5}>
                      <Grid.Item col={6} s={12} xs={12}>
                        <Field.Root name="pollingInterval">
                          <Field.Label>Polling Interval</Field.Label>
                          <TextInput
                            type="number"
                            value={settings.pollingInterval}
                            onChange={handleChange('pollingInterval')}
                            size="M"
                          />
                          <Field.Hint>
                            Time in milliseconds between status checks. Recommended: 5000-10000ms (5-10 seconds). Lower values increase server load.
                          </Field.Hint>
                        </Field.Root>
                      </Grid.Item>
                    </Grid.Root>
                  </Flex>
                </Box>
              </Tabs.Content>

              {/* Save Button - Fixed at bottom */}
              <Box 
                padding={6} 
                paddingTop={4}
                background="neutral100"
                style={{ borderTop: '1px solid #eaeaef' }}
              >
                <Flex justifyContent="flex-end">
                  <Button
                    type="submit"
                    loading={isSaving}
                    startIcon={<Check />}
                    size="L"
                  >
                    Save Settings
                  </Button>
                </Flex>
              </Box>
            </form>
          </Tabs.Root>
        </Box>
        </Box>
        <BrandingFooter />
      </Layouts.Content>
    </Page.Main>
  );
};

export default SettingsPage;
