import { useState } from 'react'
import { KeyRound, Shield } from 'lucide-react'
import { DA } from '../api'

export default function Settings() {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPass.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPass !== confirmPass) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await DA.changePassword(oldPass, newPass)
      if (res.error) {
        setError(res.message || 'Failed to change password')
      } else {
        setMessage('Password changed successfully! Please login again with the new password.')
        setOldPass('')
        setNewPass('')
        setConfirmPass('')
      }
    } catch (e: any) {
      setError(e.message || 'Error changing password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <KeyRound size={22} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Change Password</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Update your DirectAdmin login password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Current Password</label>
            <input className="input" type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">New Password</label>
            <input className="input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Confirm New Password</label>
            <input className="input" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner" /> : <><Shield size={16} /> Change Password</>}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Security Tips</h3>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Use a strong unique password (mix of letters, numbers, symbols)</li>
          <li>Never share your DirectAdmin password</li>
          <li>This app never stores passwords on disk</li>
        </ul>
      </div>
    </div>
  )
}
