import type { DAResponse } from './lib/da'

export type { DAResponse } from './lib/da'

export type DARole = 'user' | 'reseller' | 'admin'

export interface DASession {
  baseUrl: string
  username: string
  role: DARole
  allowSelfSigned: boolean
}

export interface DALoginPayload {
  baseUrl: string
  username: string
  password: string
  allowSelfSigned: boolean
}

export interface DARequestOptions {
  command: string
  params?: Record<string, string | number | boolean | undefined>
  method?: 'GET' | 'POST'
}

export interface DALoginResult {
  success: boolean
  error?: string
  session?: DASession
}

export interface DALocalFile {
  name: string
  base64: string
}

export interface DAReadFileResult {
  success: boolean
  text: string
  base64: string
}

export interface DASaveFilePayload {
  defaultName: string
  content: string
  encoding: 'utf8' | 'base64'
}

declare global {
  interface Window {
    daApi: {
      login: (payload: DALoginPayload) => Promise<DALoginResult>
      logout: () => Promise<boolean>
      getSession: () => Promise<DASession | null>
      request: (options: DARequestOptions) => Promise<DAResponse>
      uploadFile: (payload: { path: string; name: string; base64: string }) => Promise<DAResponse>
      readRemoteFile: (path: string) => Promise<DAReadFileResult>
      pickFile: () => Promise<DALocalFile | null>
      saveFile: (payload: DASaveFilePayload) => Promise<boolean>
    }
  }
}

export {}
