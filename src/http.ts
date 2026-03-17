// ============================================================
// Agent Imprint SDK — HTTP Transport
// ============================================================

import {
  ImprintApiError,
  ImprintAuthError,
  ImprintNotFoundError,
  ImprintValidationError,
} from './errors.js';

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
      requiresAuth?: boolean;
    } = {},
  ): Promise<T> {
    const { body, params, requiresAuth = true } = options;
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (requiresAuth) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let responseBody: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    if (!response.ok) {
      await this.throwError(response.status, responseBody);
    }

    return responseBody as T;
  }

  private async throwError(status: number, body: unknown): Promise<never> {
    const bodyObj = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
    const message = typeof bodyObj['message'] === 'string' ? bodyObj['message'] : `HTTP ${status}`;

    switch (status) {
      case 401:
        throw new ImprintAuthError(message, body);
      case 404:
        throw new ImprintNotFoundError(message, body);
      case 422: {
        const errors = (bodyObj['errors'] as Record<string, string[]>) ?? {};
        throw new ImprintValidationError(message, errors, body);
      }
      default:
        throw new ImprintApiError(message, status, body);
    }
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, requiresAuth = true): Promise<T> {
    return this.request<T>('GET', path, { params, requiresAuth });
  }

  async post<T>(path: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>('POST', path, { body, requiresAuth });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
