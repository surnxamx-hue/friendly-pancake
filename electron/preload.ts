import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('daApi', {
  login: (payload: { baseUrl: string; username: string; password: string }) =>
    ipcRenderer.invoke('da:login', payload),
  
  logout: () => ipcRenderer.invoke('da:logout'),
  
  getSession: () => ipcRenderer.invoke('da:get-session'),
  
  request: (options: { method?: string; command: string; params?: Record<string, string> }) =>
    ipcRenderer.invoke('da:request', options)
})
