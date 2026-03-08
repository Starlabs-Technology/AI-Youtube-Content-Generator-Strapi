import aiJob from './ai-job';
import ApifyClient from './apify-client';
import GeminiClient from './gemini-client';
import settings from './settings';
import connection from './connection';

export default {
  'ai-job': aiJob,
  'apify-client': ApifyClient,
  'gemini-client': GeminiClient,
  settings,
  connection,
};
