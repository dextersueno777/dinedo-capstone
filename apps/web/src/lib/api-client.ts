import { API_BASE_URL } from './env';
import type { ApiErrorPayload } from './api-types';

type ApiClientOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  cache?: RequestCache;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: ApiErrorPayload | null,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    cache: options.cache ?? 'no-store',
    headers: buildHeaders(options),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new ApiClientError(
      getErrorMessage(payload, response.statusText),
      response.status,
      payload,
    );
  }

  return payload as T;
}

function buildUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

function buildHeaders(options: ApiClientOptions) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
}

async function parsePayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getErrorMessage(
  payload: ApiErrorPayload | null,
  fallback: string,
) {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(', ');
  }

  return payload?.message ?? payload?.error ?? fallback;
}
