/**
 * Gemini Client - Sends YouTube transcript to Google Gemini
 * and receives a structured blog/article in return.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiConfig {
  apiKey: string;
  /** Model name, e.g. "gemini-2.0-flash" */
  model: string;
  /** Max time (ms) to wait for Gemini response. Default 120 s. */
  timeout?: number;
}

export interface GeneratedArticle {
  headline: string;
  summary: string;
  article: string;
  tags: string[];
}

export class GeminiClient {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 120_000,
    };
  }

  /**
   * Generate a blog / news article from a YouTube transcript.
   *
   * @param transcript  Full transcript text
   * @param videoMeta   Optional metadata (channel name, description, etc.)
   */
  async generateArticle(
    transcript: string,
    videoMeta?: {
      videoId?: string;
      channelName?: string;
      description?: string;
      datePublished?: string;
      keywords?: string[];
    },
  ): Promise<GeneratedArticle> {
    const metaContext = videoMeta
      ? [
          videoMeta.channelName && `Channel: ${videoMeta.channelName}`,
          videoMeta.description && `Video description: ${videoMeta.description}`,
          videoMeta.datePublished && `Published: ${videoMeta.datePublished}`,
          videoMeta.keywords?.length && `Keywords: ${videoMeta.keywords.join(', ')}`,
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const prompt = `You are an expert content writer and journalist. You will be given the transcript of a YouTube video along with some metadata. Your task is to create a high-quality blog article from this transcript.

REQUIREMENTS:
1. Write a compelling headline/title for the article
2. Write a 2-3 sentence summary/excerpt
3. Write the full article in Markdown format. The article should be:
   - Well-structured with clear headings (##, ###)
   - Written in a professional, engaging journalistic tone
   - Between 800-2000 words depending on the transcript length
   - Include key quotes from the transcript where relevant
   - Have a strong introduction and conclusion
   - Be factual and based only on the transcript content
4. Suggest 3-5 relevant tags/categories

${metaContext ? `VIDEO METADATA:\n${metaContext}\n\n` : ''}TRANSCRIPT:
${transcript.substring(0, 30000)}

Respond ONLY with valid JSON in this exact format (no markdown code fences):
{
  "headline": "The article title here",
  "summary": "A 2-3 sentence summary/excerpt of the article.",
  "article": "The full article in Markdown format...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const url = `${GEMINI_BASE}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    // Retry up to 4 times on 429 (rate-limit) with exponential backoff
    let response: Response | undefined;
    const maxRetries = 4;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(this.config.timeout ?? 120_000),
      });

      if (response.status !== 429 || attempt === maxRetries) break;

      // Parse retry delay from response or use exponential backoff
      const retryJson = await response.json().catch(() => null) as any;
      const retryDelay = retryJson?.error?.details
        ?.find((d: any) => d['@type']?.includes('RetryInfo'))
        ?.retryDelay;
      const waitSec = retryDelay ? parseFloat(retryDelay) : Math.pow(2, attempt + 1);
      const waitMs = Math.min((waitSec || 10) * 1000, 60_000);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    if (!response || !response.ok) {
      const errorText = await response?.text().catch(() => '') ?? 'no response';
      throw new Error(`Gemini API error (${response?.status}): ${errorText}`);
    }

    const json = await response.json() as any;

    // Extract the text content from Gemini's response structure
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    // Parse the JSON response (strip markdown code fences if present)
    const cleaned = text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

    let parsed: GeneratedArticle;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Failed to parse Gemini response as JSON: ${cleaned.substring(0, 200)}`);
    }

    if (!parsed.headline || !parsed.article) {
      throw new Error('Gemini response missing required fields (headline, article)');
    }

    return parsed;
  }

  /**
   * Health check — uses the models.get endpoint (zero generation quota cost)
   * so we never burn free-tier tokens just to check connectivity.
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const url = `${GEMINI_BASE}/models/${this.config.model}?key=${this.config.apiKey}`;

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { status: 'error', message: `Gemini responded with ${response.status}: ${text.substring(0, 200)}` };
      }

      const json = await response.json() as any;
      return { status: 'ok', message: `Connected to Gemini model: ${json?.displayName || this.config.model}` };
    } catch (err: any) {
      return { status: 'error', message: err?.message || 'Gemini unreachable' };
    }
  }
}

export default GeminiClient;
