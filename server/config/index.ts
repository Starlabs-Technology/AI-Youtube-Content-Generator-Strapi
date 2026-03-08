export default {
  default: {
    // Default values - can be overridden by stored settings in database
    apifyApiToken: process.env.APIFY_API_TOKEN || '',
    apifyActorId: process.env.APIFY_ACTOR_ID || '1s7eXiaukVuOr4Ueg',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    pollingInterval: 5000,
  },
  validator(config) {
    // Validation is now handled by the settings service
    // This allows the plugin to start even without env vars
    // since settings can be configured from the admin panel
  },
};
