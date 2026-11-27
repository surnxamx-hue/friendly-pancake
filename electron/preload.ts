import { contextBridge, ipcRenderer } from 'electron'
import type {
  DALoginPayload,
  DALoginResult,
  DARequestOptions,
  DAResponse,
  DASaveFilePayload,
  DASession,
  DALocalFile,
  DAReadFileResult
} from '../src/types'

const api = {
  login: (payload: DALoginPayload): Promise<DALoginResult> =>
    ipcRenderer.invoke('da:login', payload),
  logout: (): Promise<boolean> =>
    ipcRenderer.invoke('da:logout'),
  getSession: (): Promise<DASession | null> =>
    ipcRenderer.invoke('da:get-session'),
  request: (options: DARequestOptions): Promise<DAResponse> =>
    ipcRenderer.invoke('da:request', options),
  uploadFile: (payload: { path: string; name: string; base64: string }): Promise<DAResponse> =>
    ipcRenderer.invoke('da:upload', payload),
  readRemoteFile: (remotePath: string): Promise<DAReadFileResult> =>
    ipcRenderer.invoke('da:read-remote-file', remotePath),
  pickFile: (): Promise<DALocalFile | null> =>
    ipcRenderer.invoke('da:pick-file'),
  saveFile: (payload: DASaveFilePayload): Promise<boolean> =>
    ipcRenderer.invoke('da:save-file', payload)
}

contextBridge.exposeInMainWorld('daApi', api)
