/**
 * Apify Client - Calls the Apify YouTube Transcript Scraper actor
 * to extract transcripts from YouTube videos.
 *
 * Flow:
 *   1. Start an actor run with the YouTube URL
 *   2. Poll the run until it reaches a terminal state (SUCCEEDED / FAILED / ABORTED / TIMED-OUT)
 *   3. Fetch the transcript from the run's default dataset
 */

const APIFY_BASE = 'https://api.apify.com/v2';

interface ApifyConfig {
  apiToken: string;
  actorId: string;
  /** Max time (ms) to wait for the actor run to finish. Default 5 min. */
  runTimeout?: number;
  /** Interval (ms) between status polls. Default 5 s. */
  pollInterval?: number;
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
    defaultKeyValueStoreId: string;
    startedAt: string;
    finishedAt: string | null;
  };
}

export interface TranscriptResult {
  videoId: string;
  captions: string[];
  channelName?: string;
  channelHandle?: string;
  description?: string;
  viewCount?: number;
  likes?: number;
  datePublished?: string;
  keywords?: string[];
  thumbnail?: string;
}

export class ApifyClient {
  private config: ApifyConfig;

  constructor(config: ApifyConfig) {
    this.config = {
      ...config,
      runTimeout: config.runTimeout ?? 5 * 60 * 1000,
      pollInterval: config.pollInterval ?? 5000,
    };
  }

  /** Start a new actor run and return the run ID */
  async startRun(youtubeUrl: string): Promise<string> {
    const url = `${APIFY_BASE}/acts/${this.config.actorId}/runs?token=${this.config.apiToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [youtubeUrl],
        outputFormat: 'captions',
        maxRetries: 3,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Apify: failed to start actor run (${response.status}): ${text}`);
    }

    const json = (await response.json()) as ApifyRunResponse;
    const runId = json?.data?.id;

    if (!runId) {
      throw new Error('Apify: actor run response did not contain a run ID');
    }

    return runId;
  }

  /** Poll the run until it finishes. Returns the run data. */
  async waitForRun(runId: string): Promise<ApifyRunResponse['data']> {
    const deadline = Date.now() + (this.config.runTimeout ?? 300_000);

    while (Date.now() < deadline) {
      const url = `${APIFY_BASE}/actor-runs/${runId}?token=${this.config.apiToken}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Apify: failed to fetch run status (${response.status})`);
      }

      const json = (await response.json()) as ApifyRunResponse;
      const status = json?.data?.status;

      if (status === 'SUCCEEDED') {
        return json.data;
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Apify: actor run ${status}`);
      }

      // Still RUNNING / READY — wait and retry
      await this.sleep(this.config.pollInterval ?? 5000);
    }

    throw new Error('Apify: actor run timed out waiting for completion');
  }

  /** Retrieve transcript items from the run's default dataset */
  async getTranscript(datasetId: string): Promise<TranscriptResult[]> {
    const url = `${APIFY_BASE}/datasets/${datasetId}/items?token=${this.config.apiToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Apify: failed to fetch dataset items (${response.status})`);
    }

    const items = (await response.json()) as TranscriptResult[];
    return items || [];
  }

  /** Convenience: run the full pipeline – start, wait, get transcript text */
  async fetchTranscript(youtubeUrl: string): Promise<{
    transcript: string;
    metadata: Partial<TranscriptResult>;
    runId: string;
  }> {
    const runId = await this.startRun(youtubeUrl);
    const runData = await this.waitForRun(runId);
    const items = await this.getTranscript(runData.defaultDatasetId);

    if (!items.length) {
      throw new Error('Apify: no transcript data returned for this video');
    }

    const item = items[0];
    const transcript = Array.isArray(item.captions)
      ? item.captions.join(' ')
      : String(item.captions || '');

    if (!transcript.trim()) {
      throw new Error('Apify: transcript is empty — video may not have captions');
    }

    return {
      transcript,
      metadata: {
        videoId: item.videoId,
        channelName: item.channelName,
        channelHandle: item.channelHandle,
        description: item.description,
        viewCount: item.viewCount,
        likes: item.likes,
        datePublished: item.datePublished,
        keywords: item.keywords,
        thumbnail: item.thumbnail,
      },
      runId,
    };
  }

  /** Simple health check — validates the API token by listing actor info */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const url = `${APIFY_BASE}/acts/${this.config.actorId}?token=${this.config.apiToken}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!response.ok) {
        return { status: 'error', message: `Apify responded with ${response.status}` };
      }

      const json = await response.json() as any;
      return {
        status: 'ok',
        message: `Connected to actor: ${json?.data?.name || this.config.actorId}`,
      };
    } catch (err: any) {
      return { status: 'error', message: err?.message || 'Apify unreachable' };
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ApifyClient;
