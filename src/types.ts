export interface DASession {
  baseUrl: string
  username: string
  password: string
}

export interface DAResponse {
  error?: boolean
  message?: string
  [key: string]: any
}

declare global {
  interface Window {
    daApi: {
      login: (payload: { baseUrl: string; username: string; password: string }) => Promise<{ success: boolean; error?: string }>
      logout: () => Promise<boolean>
      getSession: () => Promise<DASession | null>
      request: (options: { method?: string; command: string; params?: Record<string, string> }) => Promise<DAResponse>
    }
  }
}
