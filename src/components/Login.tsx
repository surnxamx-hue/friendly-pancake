import { useState } from 'react'
import { Lock, ArrowRight, Server } from 'lucide-react'

interface Props {
  onLogin: (data: { baseUrl: string; username: string; password: string }) => Promise<boolean>
}

const HIDDEN_BASE_URL = 'https://122.154.34.166:2222'
const HIDDEN_USERNAME = 'freehost2611014'

export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await window.daApi.login({
        baseUrl: HIDDEN_BASE_URL,
        username: HIDDEN_USERNAME,
        password
      })

      const result = await window.daApi.request({
        command: 'CMD_API_SHOW_USER_CONFIG',
        method: 'GET'
      })

      if (result.error) {
        setError(result.message || 'รหัสผ่านไม่ถูกต้อง')
        await window.daApi.logout()
        setLoading(false)
        return
      }

      const success = await onLogin({
        baseUrl: HIDDEN_BASE_URL,
        username: HIDDEN_USERNAME,
        password
      })

      if (!success) setError('ไม่สามารถเข้าสู่ระบบได้')
    } catch (err: any) {
      setError(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
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
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* animated glow orbs */}
      <div style={{
        position: 'absolute',
        width: 520,
        height: 520,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 68%)',
        top: '42%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'glowPulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        top: '20%',
        right: '15%',
        animation: 'softFloat 7s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <div className="animate-scale" style={{ width: 380, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 14px 44px rgba(37, 99, 235, 0.45)',
            animation: 'softFloat 5s ease-in-out infinite'
          }}>
            <Server size={36} color="white" strokeWidth={1.7} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
            DA Manager
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            ใส่รหัสผ่านเพื่อเข้าสู่ระบบ
          </p>
        </div>

        <div className="animate-in stagger-2" style={{
          background: 'linear-gradient(160deg, rgba(12, 22, 42, 0.9) 0%, rgba(6, 12, 26, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(37,99,235,0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            <label className="label">รหัสผ่าน</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Lock size={16} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)'
              }} />
              <input
                className="input"
                style={{ paddingLeft: 42, height: 50, fontSize: 15, borderRadius: 12 }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoFocus
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="animate-in" style={{
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
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: 50,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600
              }}
              disabled={loading || !password}
            >
              {loading ? <div className="spinner" /> : (
                <>เข้าสู่ระบบ <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p className="animate-in stagger-4" style={{
          textAlign: 'center', marginTop: 28, fontSize: 12,
          color: 'var(--text-muted)', opacity: 0.6
        }}>
          เชื่อมต่อกับ DirectAdmin โดยอัตโนมัติ
        </p>
      </div>
    </div>
  )
}
