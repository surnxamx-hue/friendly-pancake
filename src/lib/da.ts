export type DAResponse = Record<string, any> & {
  error?: string | number | boolean
  message?: string
  text?: string
}

export function parseDAResponse(raw: string): DAResponse {
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

export function getResponseError(res: DAResponse | null | undefined): string | null {
  if (!res || res.error === undefined || res.error === null) return null
  const value = res.error
  if (value === false || value === 0 || value === '0' || value === '') return null
  if (typeof res.message === 'string' && res.message.trim()) return res.message
  return typeof value === 'string' ? value : String(value)
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean)
  if (typeof value === 'string') return value ? [value] : []
  if (value && typeof value === 'object') {
    return Object.values(value)
      .map(item => String(item))
      .filter(Boolean)
  }
  return []
}

export function isOn(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'on' || normalized === 'yes' || normalized === '1' || normalized === 'true'
}

export function formatBytes(value: unknown): string {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const amount = bytes / Math.pow(1024, index)
  return `${amount >= 10 || index === 0 ? Math.round(amount) : amount.toFixed(1)} ${units[index]}`
}

export const LIMIT_FIELDS = [
  ['quota', 'uquota'],
  ['bandwidth', 'ubandwidth'],
  ['vdomains', 'uvdomains'],
  ['nsubdomains', 'unsubdomains'],
  ['nemails', 'unemails'],
  ['nemailf', 'unemailf'],
  ['nemailml', 'unemailml'],
  ['nemailr', 'unemailr'],
  ['mysql', 'umysql'],
  ['ftp', 'uftp'],
  ['domainptr', 'udomainptr'],
  ['inode', 'uinode']
] as const

export type LimitKey = (typeof LIMIT_FIELDS)[number][0]
export type LimitOverrides = Partial<Record<LimitKey, number | string | 'unlimited'>>

export function limitFromConfig(config: DAResponse, key: LimitKey, flag: string): number | 'unlimited' {
  if (isOn(config[flag])) return 'unlimited'
  const raw = config[key]
  if (raw === undefined || raw === null || raw === '') return 0
  const amount = Number(raw)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function normalizeLimit(value: unknown): { unlimited: boolean; amount?: number } {
  if (value === 'unlimited' || value === undefined || value === null || value === '') {
    return { unlimited: true }
  }
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) return { unlimited: true }
  return { unlimited: false, amount: Math.floor(amount) }
}

export function buildModifyUserParams(
  config: DAResponse,
  overrides: LimitOverrides = {}
): Record<string, string> {
  const params: Record<string, string> = { action: 'customize' }
  const switchKeys = [
    'cgi', 'php', 'ssl', 'ssh', 'sysinfo', 'cron', 'catchall', 'spam',
    'dnscontrol', 'login_keys', 'suspend_at_limit', 'aftp', 'userssh', 'dns', 'www'
  ]

  for (const key of switchKeys) {
    if (config[key] !== undefined) params[key] = isOn(config[key]) ? 'ON' : 'OFF'
  }

  for (const [key, flag] of LIMIT_FIELDS) {
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, key)
    const raw = hasOverride
      ? overrides[key]
      : isOn(config[flag])
        ? 'unlimited'
        : config[key]
    const { unlimited, amount } = normalizeLimit(raw)

    if (unlimited) {
      params[flag] = 'ON'
    } else {
      params[flag] = 'OFF'
      params[key] = String(amount ?? 0)
    }
  }

  for (const key of ['skin', 'language', 'package'] as const) {
    const value = config[key]
    if (value !== undefined && value !== null && value !== '') params[key] = String(value)
  }

  return params
}

export function buildCreateUserParams(payload: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {
    action: 'create',
    username: String(payload.username ?? ''),
    email: String(payload.email ?? ''),
    passwd: String(payload.passwd ?? ''),
    domain: String(payload.domain ?? '')
  }

  if (payload.package) {
    params.package = String(payload.package)
    return params
  }

  for (const [key, flag] of LIMIT_FIELDS) {
    const { unlimited, amount } = normalizeLimit(payload[key])
    if (unlimited) params[flag] = 'ON'
    else {
      params[flag] = 'OFF'
      params[key] = String(amount ?? 0)
    }
  }
  return params
}

export interface DAFileEntry {
  name: string
  type: 'file' | 'dir'
  size: string
  perm: string
  date: string
}

export function parseFileEntries(res: DAResponse): DAFileEntry[] {
  const keys = Object.keys(res)
    .filter(key => /^(?:path\/)?file\d+$/.test(key))
    .sort((a, b) => {
      const left = Number(a.match(/\d+$/)?.[0] ?? 0)
      const right = Number(b.match(/\d+$/)?.[0] ?? 0)
      return left - right
    })

  const entries: DAFileEntry[] = []
  for (const key of keys) {
    const raw = res[key]
    if (typeof raw !== 'string') continue

    const meta = parseDAResponse(raw)
    const name = String(meta.name ?? key.split('/').pop() ?? key)
    if (!name || name === '.' || name === '..') continue

    const timestamp = Number(meta.date)
    entries.push({
      name,
      type: meta.type === 'dir' ? 'dir' : 'file',
      size: String(meta.showsize ?? meta.size ?? '—'),
      perm: String(meta.perm ?? '—'),
      date: Number.isFinite(timestamp) && timestamp > 0
        ? new Date(timestamp * 1000).toLocaleString()
        : '—'
    })
  }

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return entries
}

export function joinRemotePath(base: string, name: string): string {
  const cleanBase = String(base ?? '').replace(/\/+$/, '')
  const cleanName = String(name ?? '').replace(/^\/+/, '')
  if (!cleanBase) return `/${cleanName}`
  return `${cleanBase}/${cleanName}`
}
