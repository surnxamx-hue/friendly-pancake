import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  DALoginPayload,
  DALoginResult,
  DARole,
  DASession,
  DARequestOptions
} from '../src/types'

type DAResponse = Record<string, any> & { error?: string | number | boolean; message?: string }

interface RawRequestOptions {
  method?: 'GET' | 'POST'
  command?: string
  params?: Record<string, string | number | boolean | undefined>
  body?: string | Buffer
  headers?: Record<string, string>
}

interface RawResponse {
  status: number
  buffer: Buffer
}

let mainWindow: BrowserWindow | null = null
let currentSession: DASession | null = null
let currentPassword: string | null = null

const currentDir = path.dirname(fileURLToPath(import.meta.url))

function normalizeBaseUrl(value: string): string {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) throw new Error('กรุณากรอก URL ของ DirectAdmin')
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withScheme.replace(/\/+$/, '')
}

function parseResponse(raw: string): DAResponse {
  const text = raw.trim()
  if (!text) return {}

  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') return parsed as DAResponse
    } catch {}
  }

  const result: DAResponse = {}
  for (const [rawKey, value] of new URLSearchParams(text).entries()) {
    const key = rawKey.replace(/\[\]$/, '')
    const isList = rawKey.endsWith('[]')
    const existing = result[key]

    if (isList || existing !== undefined) {
      const current = Array.isArray(existing) ? existing : existing === undefined ? [] : [existing]
      current.push(value)
      result[key] = current
    } else {
      result[key] = value
    }
  }
  return result
}

function publicSession(): DASession | null {
  return currentSession ? { ...currentSession } : null
}

async function performRequest(options: RawRequestOptions): Promise<RawResponse> {
  if (!currentSession) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')

  const url = new URL(currentSession.baseUrl)
  if (options.command) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${options.command}`
  }

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { ...(options.headers ?? {}) }
  headers.Authorization = `Basic ${Buffer.from(`${currentSession.username}:${currentPassword ?? ''}`).toString('base64')}`
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  const requestOptions: https.RequestOptions = {
    method: options.method ?? 'GET',
    headers,
    rejectUnauthorized: url.protocol === 'https:' ? !currentSession.allowSelfSigned : true
  }

  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = transport.request(url, requestOptions as any, res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })
      res.on('end', () => {
        resolve({ status: res.statusCode ?? 0, buffer: Buffer.concat(chunks) })
      })
    })

    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(new Error('เชื่อมต่อเซิร์ฟเวอร์นานเกินไป')))
    if (options.body) req.write(options.body)
    req.end()
  })
}

async function apiRequest(
  command: string,
  params: Record<string, string | number | boolean | undefined> = {},
  method: 'GET' | 'POST' = 'GET'
): Promise<DAResponse> {
  const response = await performRequest({
    method,
    command,
    params: { ...params, json: 'yes' }
  })
  const body = response.buffer.toString('utf8').trim()

  if (
    response.status === 401 ||
    /<title>\s*login/i.test(body) ||
    /invalid (username|password)/i.test(body)
  ) {
    throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
  }

  return parseResponse(body)
}

async function detectRole(): Promise<DARole> {
  try {
    const config = await apiRequest('CMD_API_SHOW_USER_CONFIG')
    const type = String(config.usertype ?? '').toLowerCase()
    if (type.includes('admin')) return 'admin'
    if (type.includes('reseller')) return 'reseller'
  } catch {}

  try {
    await apiRequest('CMD_API_SHOW_USERS')
    return 'reseller'
  } catch {}

  return 'user'
}

function multipartBody(
  boundary: string,
  fields: Record<string, string>,
  file: { field: string; filename: string; data: Buffer }
): Buffer {
  const chunks: Buffer[] = []

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    ))
  }

  const safeName = file.filename.replace(/["\r\n]/g, '_')
  chunks.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${safeName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
  ))
  chunks.push(file.data)
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`))

  return Buffer.concat(chunks)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    title: 'DA Manager',
    backgroundColor: '#01040f',
    webPreferences: {
      preload: path.join(currentDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(currentDir, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('da:login', async (_event, payload: DALoginPayload): Promise<DALoginResult> => {
  const baseUrl = normalizeBaseUrl(payload?.baseUrl)
  const username = String(payload?.username ?? '').trim()
  const password = String(payload?.password ?? '')

  if (!username || !password) {
    return { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }
  }

  currentSession = {
    baseUrl,
    username,
    role: 'user',
    allowSelfSigned: Boolean(payload?.allowSelfSigned)
  }
  currentPassword = password

  try {
    const role = await detectRole()
    currentSession = { ...currentSession, role }
    return { success: true, session: publicSession() ?? undefined }
  } catch (error: any) {
    currentSession = null
    currentPassword = null
    return { success: false, error: error?.message || 'เข้าสู่ระบบไม่สำเร็จ' }
  }
})

ipcMain.handle('da:logout', async () => {
  currentSession = null
  currentPassword = null
  return true
})

ipcMain.handle('da:get-session', async () => publicSession())

ipcMain.handle('da:request', async (_event, options: DARequestOptions) => {
  if (!options?.command) throw new Error('Missing DirectAdmin command')
  return apiRequest(options.command, options.params ?? {}, options.method ?? 'GET')
})

ipcMain.handle('da:upload', async (_event, payload: { path: string; name: string; base64: string }) => {
  const boundary = `----da-manager-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const body = multipartBody(
    boundary,
    { action: 'upload', path: String(payload?.path ?? '/') },
    {
      field: 'file1',
      filename: String(payload?.name ?? 'upload.bin'),
      data: Buffer.from(String(payload?.base64 ?? ''), 'base64')
    }
  )

  const response = await performRequest({
    method: 'POST',
    command: 'CMD_API_FILE_MANAGER',
    body,
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
  })

  return parseResponse(response.buffer.toString('utf8'))
})

ipcMain.handle('da:read-remote-file', async (_event, remotePath: string) => {
  const response = await performRequest({
    command: 'CMD_FILE_MANAGER',
    params: { path: String(remotePath ?? '/') }
  })

  if (response.status >= 400) throw new Error(`ดาวน์โหลดไม่สำเร็จ (HTTP ${response.status})`)

  return {
    success: true,
    text: response.buffer.toString('utf8'),
    base64: response.buffer.toString('base64')
  }
})

ipcMain.handle('da:pick-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'เลือกไฟล์ที่จะอัปโหลด',
    properties: ['openFile']
  })

  if (result.canceled || !result.filePaths[0]) return null

  const selected = result.filePaths[0]
  const data = await fs.readFile(selected)
  return { name: path.basename(selected), base64: data.toString('base64') }
})

ipcMain.handle('da:save-file', async (_event, payload: {
  defaultName: string
  content: string
  encoding: 'utf8' | 'base64'
}) => {
  const result = await dialog.showSaveDialog({
    title: 'บันทึกไฟล์',
    defaultPath: String(payload?.defaultName ?? 'download.bin')
  })

  if (result.canceled || !result.filePath) return false

  const content = payload?.encoding === 'base64'
    ? Buffer.from(String(payload?.content ?? ''), 'base64')
    : Buffer.from(String(payload?.content ?? ''), 'utf8')

  await fs.writeFile(result.filePath, content)
  return true
})
