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

    const failures: string[] = [];
    if (results.apify.status === 'error') failures.push(`Apify: ${results.apify.message}`);
    if (results.gemini.status === 'error') failures.push(`Gemini: ${results.gemini.message}`);

    if (failures.length) {
      const err: any = new Error(failures.join(' | '));
      err.services = results;
      throw err;
    }

    return results;
  },
});
