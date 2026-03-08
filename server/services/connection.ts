import { ApifyClient } from './apify-client';
import { GeminiClient } from './gemini-client';

export default ({ strapi }: { strapi: any }) => ({
  async test(settings: any) {
    const { apifyApiToken, apifyActorId, geminiApiKey, geminiModel } = settings;

    // Run both health checks in parallel to keep the response fast
    const [apifyResult, geminiResult] = await Promise.all([
      apifyApiToken && apifyActorId
        ? new ApifyClient({ apiToken: apifyApiToken, actorId: apifyActorId }).healthCheck()
        : Promise.resolve({ status: 'error', message: 'Apify API Token or Actor ID not configured' }),
      geminiApiKey
        ? new GeminiClient({ apiKey: geminiApiKey, model: geminiModel || 'gemini-2.5-flash' }).healthCheck()
        : Promise.resolve({ status: 'error', message: 'Gemini API Key not configured' }),
    ]);

    const results = { apify: apifyResult, gemini: geminiResult };

    // If both failed, throw an error
    if (results.apify.status === 'error' && results.gemini.status === 'error') {
      throw new Error(`Apify: ${results.apify.message} | Gemini: ${results.gemini.message}`);
    }

    return results;
  },
});
