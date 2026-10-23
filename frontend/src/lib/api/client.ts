import { ApiError, type ApiEnvelope, type ApiErrorIssue, type PaginationMeta } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1').replace(
  /\/+$/,
  '',
)

export const AUTH_UNAUTHORIZED_EVENT = 'clinic:unauthorized'

const CSRF_EXEMPT_PATHS = new Set([
  '/admin/auth/login',
  '/admin/auth/verify-otp',
  '/admin/auth/resend-otp',
  '/consultation-requests',
])

let csrfToken: string | null = null
let csrfPromise: Promise<string> | null = null

function isMutation(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

function requiresCsrf(path: string, method: string): boolean {
  return isMutation(method) && path.startsWith('/admin') && !CSRF_EXEMPT_PATHS.has(path)
}

function notifyUnauthorized(path: string) {
  if (!path.startsWith('/admin')) return
  if (CSRF_EXEMPT_PATHS.has(path)) return
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text()
  if (!text) {
    return {
      success: response.ok,
      message: response.ok ? '' : 'پاسخ نامعتبر از سرور',
      data: null as T,
    }
  }

  try {
    return JSON.parse(text) as ApiEnvelope<T>
  } catch {
    throw new ApiError('پاسخ سرور قابل خواندن نیست', response.status)
  }
}

async function fetchCsrf(force = false): Promise<string> {
  if (!force && csrfToken) return csrfToken
  if (!force && csrfPromise) return csrfPromise

  csrfPromise = (async () => {
    const response = await fetch(`${API_BASE}/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    const payload = await readEnvelope<{ csrfToken?: string }>(response)
    if (!response.ok || !payload.data?.csrfToken) {
      throw new ApiError(payload.message || 'دریافت توکن امنیتی ناموفق بود', response.status)
    }
    csrfToken = payload.data.csrfToken
    return csrfToken
  })()

  try {
    return await csrfPromise
  } finally {
    csrfPromise = null
  }
}

export function clearCsrfToken() {
  csrfToken = null
  csrfPromise = null
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

interface RequestOptions {
  method?: string
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  formData?: FormData
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<ApiEnvelope<T>> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined

  if (options.formData) {
    body = options.formData
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  if (requiresCsrf(path, method)) {
    headers['x-csrf-token'] = await fetchCsrf()
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('ارتباط با سرور برقرار نشد. اتصال شبکه و اجرای API را بررسی کنید.', 0)
  }

  if (response.status === 401) notifyUnauthorized(path)

  if (
    response.status === 403 &&
    requiresCsrf(path, method) &&
    !retried
  ) {
    clearCsrfToken()
    await fetchCsrf(true)
    return request<T>(path, options, true)
  }

  const payload = await readEnvelope<T>(response)
  if (!response.ok || payload.success === false) {
    throw new ApiError(
      payload.message || 'درخواست ناموفق بود',
      response.status,
      (payload as unknown as { errors?: ApiErrorIssue[] }).errors ?? [],
    )
  }

  return payload
}

export async function apiGet<T>(
  path: string,
  query?: RequestOptions['query'],
  signal?: AbortSignal,
): Promise<T> {
  const response = await request<T>(path, { query, signal })
  return response.data
}

export async function apiGetPaged<T>(
  path: string,
  query: RequestOptions['query'],
  mapper: (value: unknown) => T,
  signal?: AbortSignal,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const response = await request<unknown[]>(path, { query, signal })
  const items = Array.isArray(response.data) ? response.data.map(mapper) : []
  const meta: PaginationMeta = response.meta ?? {
    page: Number(query?.page ?? 1),
    limit: Number(query?.limit ?? items.length),
    total: items.length,
    totalPages: 1,
  }
  return { items, meta }
}

export async function apiSend<T>(
  path: string,
  method: string,
  body?: unknown,
  formData?: FormData,
  signal?: AbortSignal,
): Promise<T> {
  const response = await request<T>(path, { method, body, formData, signal })
  return response.data
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await request<T>(path, { method: 'DELETE' })
  return response.data
}

export { fetchCsrf }
