import { apiClient } from "./client"

export function swrFetcher<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint)
}
