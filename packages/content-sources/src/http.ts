export type QueryValue = string | number | boolean | string[] | undefined;

export interface RequestOptions {
  params?: Record<string, QueryValue>;
  authenticated?: boolean;
  headers?: Record<string, string>;
}

export type TokenProvider = () => Promise<string | null>;

export const DEFAULT_USER_AGENT = 'manga-spawn/1.0.0';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MIN_REQUEST_INTERVAL_MS = 220;

export interface HttpClientOptions {
  userAgent?: string;
  minIntervalMs?: number;
}

export class HttpClient {
  private tokenProvider: TokenProvider | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;
  private readonly userAgent: string;
  private readonly minIntervalMs: number;

  constructor(
    private readonly baseUrl: string,
    options: HttpClientOptions = {},
  ) {
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.minIntervalMs = options.minIntervalMs ?? MIN_REQUEST_INTERVAL_MS;
  }

  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  postForm<T>(url: string, form: Record<string, string>): Promise<T> {
    return this.request<T>('POST', url, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
    });
  }

  postJson<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>('POST', url, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions & { body?: string },
  ): Promise<T> {
    return this.enqueue(async () => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': this.userAgent,
        ...options.headers,
      };

      if (options.authenticated && this.tokenProvider) {
        const token = await this.tokenProvider();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const url = this.buildUrl(path, options.params);
      const response = await fetch(url, {
        method,
        headers,
        body: options.body,
      });

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('X-RateLimit-Retry-After'));
        throw new ApiError(429, 'Rate limit alcanzado. Intenta más tarde.', { retryAfter });
      }

      const text = await response.text();
      const json = text ? safeParse(text) : null;

      if (!response.ok) {
        const detail = json?.errors ?? json;
        throw new ApiError(response.status, `Error ${response.status} en ${path}`, detail);
      }

      return json as T;
    });
  }

  private buildUrl(path: string, params?: Record<string, QueryValue>): string {
    const isAbsolute = path.startsWith('http');
    const url = new URL(isAbsolute ? path : `${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const item of value) url.searchParams.append(key, item);
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const now = Date.now();
      const wait = Math.max(0, this.minIntervalMs - (now - this.lastRequestAt));
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();
      return task();
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}

export function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
