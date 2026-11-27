import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import type { DALoginPayload, DASession } from './types'

export default function App() {
  const [session, setSession] = useState<DASession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.daApi.getSession()
      .then(setSession)
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = async (payload: DALoginPayload): Promise<boolean> => {
    const result = await window.daApi.login(payload)
    if (!result.success || !result.session) {
      throw new Error(result.error || 'เข้าสู่ระบบไม่สำเร็จ')
    }
    setSession(result.session)
    return true
  }

  const handleLogout = async () => {
    await window.daApi.logout()
    setSession(null)
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!session) return <Login onLogin={handleLogin} />

  return <Dashboard session={session} onLogout={handleLogout} />
}
