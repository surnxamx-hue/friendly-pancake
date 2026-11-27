import { useEffect, useState } from 'react'
import {
  Users, RefreshCw, Save, UserPlus, Ban, CheckCircle2,
  Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react'
import { DA, daError, type CreateUserInput } from '../api'
import {
  LIMIT_FIELDS,
  formatBytes,
  limitFromConfig,
  type DAResponse,
  type LimitKey,
  type LimitOverrides
} from '../lib/da'
import type { DASession } from '../types'

interface Props {
  session: DASession
}

const EMPTY_NEW_USER: CreateUserInput = {
  username: '',
  email: '',
  passwd: '',
  domain: '',
  package: '',
  quota: 1000,
  bandwidth: 'unlimited',
  vdomains: 'unlimited',
  nsubdomains: 'unlimited',
  nemails: 'unlimited',
  mysql: 'unlimited',
  ftp: 'unlimited'
}

function limitsFromConfig(config: DAResponse): LimitOverrides {
  const result: LimitOverrides = {}
  for (const [key, flag] of LIMIT_FIELDS) {
    result[key] = limitFromConfig(config, key, flag)
  }
  return result
}

export default function Admin({ session }: Props) {
  const [users, setUsers] = useState<string[]>([])
  const [resellers, setResellers] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [config, setConfig] = useState<DAResponse | null>(null)
  const [usage, setUsage] = useState<DAResponse | null>(null)
  const [limits, setLimits] = useState<LimitOverrides>({})
  const [newUser, setNewUser] = useState<CreateUserInput>(EMPTY_NEW_USER)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadUser = async (username: string) => {
    setSelected(username)
    setError('')
    setConfig(null)
    setUsage(null)

    const [cfg, usg] = await Promise.all([
      DA.showUserConfig(username),
      DA.showUserUsageFor(username)
    ])

    const problem = daError(cfg) || daError(usg)
    if (problem) {
      setError(problem)
      return
    }

    setConfig(cfg)
    setUsage(usg)
    setLimits(limitsFromConfig(cfg))
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [userRes, resellerRes] = await Promise.all([
        DA.listUsers(),
        session.role === 'admin' ? DA.listResellers() : Promise.resolve(null)
      ])

      const problem = daError(userRes) || (resellerRes && daError(resellerRes))
      if (problem) {
        setError(problem || 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้')
        setUsers([])
        setResellers([])
        return
      }

      const names = DA.userNames(userRes)
      const resellerNames = resellerRes ? DA.userNames(resellerRes) : []
      setUsers(names)
      setResellers(resellerNames)

      if (names[0]) await loadUser(names[0])
      else setSelected('')
    } catch (err: any) {
      setError(err?.message || 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateLimit = (key: LimitKey, value: string) => {
    setLimits(current => ({
      ...current,
      [key]: value === 'unlimited' ? 'unlimited' : Math.max(0, Number(value) || 0)
    }))
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await DA.modifyUser({ username: selected, ...limits })
      const problem = daError(res)
      if (problem) setError(problem)
      else {
        setMessage(`อัปเดตโควต้าของ ${selected} สำเร็จ`)
        await loadUser(selected)
      }
    } catch (err: any) {
      setError(err?.message || 'บันทึกโควต้าไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    if (!newUser.username || !newUser.email || !newUser.passwd || !newUser.domain) {
      setError('กรอก username, email, password และ domain ให้ครบ')
      setSaving(false)
      return
    }

    try {
      const res = await DA.createUser(newUser)
      const problem = daError(res)
      if (problem) setError(problem)
      else {
        setMessage(`สร้างผู้ใช้ ${newUser.username} สำเร็จ`)
        setNewUser(EMPTY_NEW_USER)
        await load()
      }
    } catch (err: any) {
      setError(err?.message || 'สร้างผู้ใช้ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleSuspend = async (suspend: boolean) => {
    if (!selected) return
    if (!window.confirm(`${suspend ? 'ระงับ' : 'ปลดระงับ'}ผู้ใช้ ${selected}?`)) return

    setSaving(true)
    setError('')
    try {
      const res = await DA.setUserSuspended(selected, suspend)
      const problem = daError(res)
      if (problem) setError(problem)
      else {
        setMessage(`${suspend ? 'ระงับ' : 'ปลดระงับ'} ${selected} สำเร็จ`)
        await loadUser(selected)
      }
    } catch (err: any) {
      setError(err?.message || 'เปลี่ยนสถานะผู้ใช้ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected || !window.confirm(`ลบผู้ใช้ ${selected} ถาวร? การนี้ไม่สามารถย้อนกลับได้`)) return

    setSaving(true)
    setError('')
    try {
      const res = await DA.deleteUser(selected)
      const problem = daError(res)
      if (problem) setError(problem)
      else {
        setMessage(`ลบผู้ใช้ ${selected} สำเร็จ`)
        setSelected('')
        await load()
      }
    } catch (err: any) {
      setError(err?.message || 'ลบผู้ใช้ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="animate-fade-down" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={20} color="#60a5fa" />
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>Admin / Reseller</h3>
          <span className={`badge ${session.role === 'admin' ? 'badge-success' : 'badge-warning'}`}>
            {session.role}
          </span>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card animate-in stagger-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Users size={18} color="#60a5fa" />
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Users</h4>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{users.length}</span>
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : users.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ไม่พบผู้ใช้หรือบัญชีนี้ไม่มีสิทธิ์ดูรายชื่อ</p>
          ) : (
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {users.map(username => (
                <button
                  key={username}
                  onClick={() => loadUser(username)}
                  className={`btn btn-ghost ${selected === username ? 'nav-active' : ''}`}
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 8, marginBottom: 3 }}
                >
                  <Users size={15} /> {username}
                </button>
              ))}
            </div>
          )}

          {resellers.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="label">Resellers</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {resellers.map(name => (
                  <span key={name} className="badge badge-warning">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card animate-in stagger-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Save size={18} color="#60a5fa" />
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Quota · {selected || '—'}</h4>
          </div>

          {!config ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>เลือกผู้ใช้เพื่อดูและแก้ไขโควต้า</p>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                marginBottom: 16, fontSize: 12, color: 'var(--text-muted)'
              }}>
                <div>Disk used: <strong style={{ color: 'var(--text)' }}>{formatBytes(usage?.quota)}</strong></div>
                <div>Bandwidth: <strong style={{ color: 'var(--text)' }}>{formatBytes(usage?.bandwidth)}</strong></div>
                <div>Domain: <strong style={{ color: 'var(--text)' }}>{String(config.domain ?? '—')}</strong></div>
                <div>Type: <strong style={{ color: 'var(--text)' }}>{String(config.usertype ?? '—')}</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {LIMIT_FIELDS.map(([key, flag]) => (
                  <div key={key}>
                    <label className="label">{key === 'quota' ? 'Disk (MB)' : key}</label>
                    <select
                      className="input"
                      style={{ height: 38, padding: '0 10px', marginBottom: 4 }}
                      value={limits[key] === 'unlimited' ? 'unlimited' : 'number'}
                      onChange={event => updateLimit(key, event.target.value)}
                    >
                      <option value="unlimited">unlimited ({flag})</option>
                      <option value="number">กำหนดเอง</option>
                    </select>
                    {limits[key] !== 'unlimited' && (
                      <input
                        className="input"
                        type="number"
                        min={0}
                        style={{ height: 38 }}
                        value={String(limits[key] ?? 0)}
                        onChange={event => updateLimit(key, event.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0' }}>
                แอปจะส่งค่าเดิมทั้งชุดกลับไปเพื่อไม่ให้สวิตช์อื่นถูกรีเซ็ต
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'กำลังบันทึก…' : 'บันทึกโควต้า'}
                </button>
                <button className="btn btn-ghost" onClick={() => handleSuspend(true)} disabled={saving}>
                  <Ban size={16} /> ระงับ
                </button>
                <button className="btn btn-ghost" onClick={() => handleSuspend(false)} disabled={saving}>
                  <CheckCircle2 size={16} /> ปลดระงับ
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  <Trash2 size={16} /> ลบผู้ใช้
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card animate-in stagger-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <UserPlus size={18} color="#60a5fa" />
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>สร้างผู้ใช้ใหม่</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              ['username', 'Username'],
              ['email', 'Email'],
              ['domain', 'Domain'],
              ['passwd', 'Password'],
              ['package', 'Package (ไม่บังคับ)']
            ] as const).map(([key, label]) => (
              <div key={key} style={{ gridColumn: key === 'package' ? '1 / -1' : undefined }}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  type={key === 'passwd' ? 'password' : key === 'email' ? 'email' : 'text'}
                  value={String(newUser[key] ?? '')}
                  onChange={event => setNewUser(current => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0' }}>
            หากไม่ระบุ Package จะใช้โควต้าด้านล่าง (ค่าเริ่มต้น 1000 MB)
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Disk (MB)</label>
              <input
                className="input"
                value={String(newUser.quota ?? '')}
                onChange={event => setNewUser(current => ({ ...current, quota: event.target.value }))}
              />
            </div>
            <div>
              <label className="label">Bandwidth (MB)</label>
              <input
                className="input"
                value={String(newUser.bandwidth ?? '')}
                onChange={event => setNewUser(current => ({ ...current, bandwidth: event.target.value }))}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleCreate} disabled={saving} style={{ marginTop: 16 }}>
            <UserPlus size={16} /> สร้างผู้ใช้
          </button>
        </div>
      </div>

      <div style={{
        marginTop: 18, display: 'flex', gap: 8, alignItems: 'flex-start',
        fontSize: 12, color: 'var(--text-muted)',
        background: 'rgba(245, 158, 11, 0.07)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        padding: 12, borderRadius: 10
      }}>
        <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
        <span>
          ฟังก์ชัน Admin/Reseller ใช้ DirectAdmin Legacy API และต้องการสิทธิ์ที่เหมาะสม
          ก่อนลบผู้ใช้จริง ควรสำรองข้อมูลและตรวจสอบชื่อผู้ใช้ให้ถูกต้อง
        </span>
      </div>
    </div>
  )
}
