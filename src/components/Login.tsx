import { useState, type FormEvent } from 'react'
import { Lock, ArrowRight, Server, ShieldAlert, User, Link2 } from 'lucide-react'
import type { DALoginPayload } from '../types'

interface Props {
  onLogin: (data: DALoginPayload) => Promise<boolean>
}

const DEFAULT_BASE_URL = 'https://122.154.34.166:2222'
const DEFAULT_USERNAME = 'freehost2611014'

export default function Login({ onLogin }: Props) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [username, setUsername] = useState(DEFAULT_USERNAME)
  const [password, setPassword] = useState('')
  const [allowSelfSigned, setAllowSelfSigned] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await onLogin({ baseUrl, username, password, allowSelfSigned })
      if (!success) setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล')
    } catch (err: any) {
      setError(err?.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #0c1a38 0%, #050b18 40%, #01040f 100%)',
      overflow: 'auto',
      padding: 24
    }}>
      <div className="animate-scale" style={{ width: 420, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 14px 44px rgba(37, 99, 235, 0.45)'
          }}>
            <Server size={36} color="white" strokeWidth={1.7} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
            DA Manager
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            เข้าสู่ระบบ DirectAdmin (User / Reseller / Admin)
          </p>
        </div>

        <div className="animate-in stagger-2" style={{
          background: 'linear-gradient(160deg, rgba(12, 22, 42, 0.94) 0%, rgba(6, 12, 26, 0.97) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(37,99,235,0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">DirectAdmin URL</label>
              <div style={{ position: 'relative' }}>
                <Link2 size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  className="input"
                  style={{ paddingLeft: 42, height: 46 }}
                  type="url"
                  value={baseUrl}
                  onChange={event => setBaseUrl(event.target.value)}
                  placeholder="https://your-server:2222"
                  required
                  autoComplete="url"
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  className="input"
                  style={{ paddingLeft: 42, height: 46 }}
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  placeholder="username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  className="input"
                  style={{ paddingLeft: 42, height: 46 }}
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
            </div>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              fontSize: 12, color: 'var(--text-muted)',
              background: 'rgba(245, 158, 11, 0.07)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              padding: 11, borderRadius: 10, marginBottom: 18, cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={allowSelfSigned}
                onChange={event => setAllowSelfSigned(event.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                <ShieldAlert size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                ยอมรับใบรับรองที่เซิร์ฟเวอร์-sign เอง (เฉพาะเซิร์ฟเวอร์ที่คุณเชื่อใจเท่านั้น)
              </span>
            </label>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '11px 14px',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary animate-in stagger-3"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: 48,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600
              }}
              disabled={loading || !password || !username || !baseUrl}
            >
              {loading ? <div className="spinner" /> : (
                <>เข้าสู่ระบบ <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 24, fontSize: 12,
          color: 'var(--text-muted)', opacity: 0.65
        }}>
          รหัสผ่านจะถูกเก็บในหน่วยความจำเฉพาะขณะเปิดแอปเท่านั้น
        </p>
      </div>
    </div>
  )
}
