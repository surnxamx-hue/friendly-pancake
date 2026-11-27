import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import type { DASession } from './types'

export default function App() {
  const [session, setSession] = useState<DASession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.daApi.getSession().then(s => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  const handleLogin = async (data: { baseUrl: string; username: string; password: string }) => {
    const result = await window.daApi.login(data)
    if (result.success) {
      setSession(data)
      return true
    }
    return false
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

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard session={session} onLogout={handleLogout} />
}
