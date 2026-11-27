process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1000,
    minHeight: 700,
    title: 'DA Manager - DirectAdmin Desktop',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    titleBarStyle: 'default'
  })

  win.once('ready-to-show', () => {
    win?.show()
  })

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

// Simple secure storage in memory for session
let currentSession: {
  baseUrl: string
  username: string
  password: string
} | null = null

ipcMain.handle('da:login', async (_event, payload: { baseUrl: string; username: string; password: string }) => {
  try {
    const url = payload.baseUrl.replace(/\/$/, '')
    // Test connection with CMD_API_SHOW_USER_CONFIG or similar
    const testUrl = `${url}/CMD_API_LOGIN_TEST`
    
    // We just store it; real test happens in renderer via fetch through preload proxy
    currentSession = {
      baseUrl: url,
      username: payload.username,
      password: payload.password
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('da:get-session', () => {
  return currentSession
})

ipcMain.handle('da:logout', () => {
  currentSession = null
  return true
})

// Proxy for DirectAdmin API calls (to avoid CORS and keep credentials in main)
ipcMain.handle('da:request', async (_event, options: {
  method?: string
  command: string
  params?: Record<string, string>
}) => {
  if (!currentSession) {
    throw new Error('Not logged in')
  }

  const { baseUrl, username, password } = currentSession
  const method = options.method || 'POST'
  const params = new URLSearchParams(options.params || {})

  const url = `${baseUrl}/${options.command}`

  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DA-Manager-Electron/1.0'
      },
      body: method === 'POST' ? params.toString() : undefined
    })

    const text = await response.text()
    
    // DirectAdmin returns key=value&key2=value2 format or JSON in some cases
    const result: Record<string, any> = {}
    
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        return JSON.parse(text)
      } catch {
        // fall through
      }
    }

    // Parse traditional CMD_API response
    text.split('&').forEach(pair => {
      const [key, ...rest] = pair.split('=')
      if (key) {
        result[decodeURIComponent(key)] = decodeURIComponent(rest.join('=') || '')
      }
    })

    // Check for error
    if (result.error) {
      return { error: true, message: result.text || result.error || 'Unknown error', raw: result }
    }

    return result
  } catch (err: any) {
    return { error: true, message: err.message || 'Network error' }
  }
})
