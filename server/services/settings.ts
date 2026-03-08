export default ({ strapi }) => ({
  async getSettings() {
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'ai-youtube-article',
    });

    const stored = (await pluginStore.get({ key: 'settings' })) as Record<string, any> | null;

    // Return with defaults from env vars, only picking known keys from the store
    // so stale fields from the old Python-based config are ignored.
    return {
      apifyApiToken:  stored?.apifyApiToken  || process.env.APIFY_API_TOKEN || '',
      apifyActorId:   stored?.apifyActorId   || process.env.APIFY_ACTOR_ID  || '1s7eXiaukVuOr4Ueg',
      geminiApiKey:   stored?.geminiApiKey    || process.env.GEMINI_API_KEY  || '',
      geminiModel:    stored?.geminiModel     || process.env.GEMINI_MODEL    || 'gemini-2.5-flash',
      pollingInterval: stored?.pollingInterval ?? 5000,
    };
  },

  async updateSettings(data) {
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'ai-youtube-article',
    });

    // Validate required fields
    if (!data.apifyApiToken) {
      throw new Error('Apify API Token is required');
    }
    if (!data.geminiApiKey) {
      throw new Error('Gemini API Key is required');
    }

    const settings = {
      apifyApiToken: data.apifyApiToken,
      apifyActorId: data.apifyActorId || '1s7eXiaukVuOr4Ueg',
      geminiApiKey: data.geminiApiKey,
      geminiModel: data.geminiModel || 'gemini-2.5-flash',
      pollingInterval: data.pollingInterval || 5000,
    };

    await pluginStore.set({
      key: 'settings',
      value: settings,
    });

    return settings;
  },
});
