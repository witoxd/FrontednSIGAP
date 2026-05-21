import { z } from "zod"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// El token ya no se maneja en el cliente — el navegador envía la cookie
// httpOnly automáticamente. Estas funciones se mantienen vacías para no
// romper imports existentes durante la migración.
export function setToken(_token: string) {}
export function removeToken() {}

/**
 * Valida los datos recibidos contra un schema Zod.
 * Lanza un error claro si la estructura no coincide.
 * Útil para envolver llamadas a `api.*` en los servicios.
 *
 * @example
 *   const data = await validateWith(CursoSchema, cursosApi.getById(id))
 */
export async function validateWith<T>(
  schema: z.ZodSchema<T>,
  promise: Promise<unknown>
): Promise<T> {
  const raw = await promise
  // Algunos endpoints devuelven JSON doblemente serializado (string en vez de objeto)
  const parsed = typeof raw === "string" ? (() => { try { return JSON.parse(raw) } catch { return raw } })() : raw
  const result = schema.safeParse(parsed)
  if (!result.success) {
    console.error("[Zod] Issues:", JSON.stringify(result.error.issues, null, 2))
    console.error("[Zod] Datos recibidos:", JSON.stringify(parsed, null, 2))
    throw new Error("La respuesta del servidor no tiene el formato esperado")
  }
  return result.data
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  }).then((r) => {
    isRefreshing = false
    refreshPromise = null
    return r.ok
  }).catch(() => {
    isRefreshing = false
    refreshPromise = null
    return false
  })

  return refreshPromise
}

async function handleResponse<T>(
  response: Response,
  retry: () => Promise<T>,
  skipRefresh = false,
): Promise<T> {
  if (response.status === 401) {
    if (!skipRefresh) {
      const refreshed = await tryRefresh()
      if (refreshed) return retry()
    }
    // Solo redirigir si no estamos ya en /login para evitar bucle infinito
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login"
    }
    throw new Error("Sesión expirada")
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}`)
  }

  return data as T
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, ...rest } = options

  let url = `${API_BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value))
    }
    url += `?${searchParams.toString()}`
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  }

  const doFetch = () =>
    fetch(url, {
      headers,
      credentials: "include", // envía las cookies httpOnly automáticamente
      ...rest,
    })

  const response = await doFetch()

  return handleResponse<T>(response, () =>
    doFetch().then((r) => handleResponse<T>(r, () => { throw new Error("Sesión expirada") }, true))
  )
}

// Shortcuts
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number>) =>
    apiClient<T>(endpoint, { method: "GET", params }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: "DELETE" }),
}
