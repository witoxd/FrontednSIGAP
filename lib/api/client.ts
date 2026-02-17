
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("sigap_token")
}

export function setToken(token: string) {
  localStorage.setItem("sigap_token", token)
}

export function removeToken() {
  localStorage.removeItem("sigap_token")
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    removeToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Sesion expirada")
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

  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  }

  const response = await fetch(url, {
    headers,
    ...rest,
  })

  return handleResponse<T>(response)
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
