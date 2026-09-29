import { ApiError } from '../../http';
import { sleep } from '../../http';

const BASE_URL = 'https://weebcentral.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const MIN_INTERVAL_MS = 350;

export interface FetchOptions {
  hx?: boolean;
}

export class WeebCentralClient {
  private lastRequestAt = 0;

  async fetchHtml(path: string, options: FetchOptions = {}): Promise<string> {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - this.lastRequestAt));
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();

    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(options.hx ? { 'HX-Request': 'true' } : {}),
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `WeebCentral respondió ${response.status}`);
    }

    return response.text();
  }

  get baseUrl(): string {
    return BASE_URL;
  }
}
