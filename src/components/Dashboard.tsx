import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Globe, Mail, Database, 
  LogOut, RefreshCw, Server, User, FolderOpen,
  Network, Settings as SettingsIcon, Users
} from 'lucide-react'
import type { DASession } from '../types'
import { DA } from '../api'
import Overview from './Overview'
import Domains from './Domains'
import Emails from './Emails'
import Databases from './Databases'
import Subdomains from './Subdomains'
import Ftp from './Ftp'
import FileManager from './FileManager'
import Settings from './Settings'
import Admin from './Admin'

interface Props {
  session: DASession
  onLogout: () => void
}

type Tab = 'overview' | 'domains' | 'subdomains' | 'emails' | 'databases' | 'ftp' | 'files' | 'admin' | 'settings'

export default function Dashboard({ session, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [config, setConfig] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [cfg, usg] = await Promise.all([
        DA.showUserConfig(),
        DA.showUsage()
      ])
      if (!cfg.error) setConfig(cfg)
      if (!usg.error) setUsage(usg)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const domainStr = config?.domain || config?.domains || ''

  const navItems = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'domains' as Tab, label: 'Domains', icon: Globe },
    { id: 'subdomains' as Tab, label: 'Subdomains', icon: Network },
    { id: 'emails' as Tab, label: 'Emails', icon: Mail },
    { id: 'databases' as Tab, label: 'Databases', icon: Database },
    { id: 'ftp' as Tab, label: 'FTP', icon: FolderOpen },
    { id: 'files' as Tab, label: 'File Manager', icon: FolderOpen },
    { id: 'admin' as Tab, label: 'Admin / Reseller', icon: Users },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ].filter(item => item.id !== 'admin' || session.role !== 'user')

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 248,
        background: 'linear-gradient(180deg, #060d1c 0%, #030810 100%)',
        borderRight: '1px solid rgba(59, 130, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        boxShadow: '8px 0 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ padding: '4px 12px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
          }}>
            <Server size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>DA Manager</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>v1.1.0</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map((item, index) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`btn btn-ghost animate-in ${active ? 'nav-active' : ''}`}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  marginBottom: 3,
                  borderRadius: 10,
                  padding: '11px 14px',
                  animationDelay: `${index * 0.04}s`
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{
          borderTop: '1px solid rgba(59, 130, 246, 0.12)',
          paddingTop: 16,
          marginTop: 8
        }}>
          <div style={{ padding: '0 12px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <User size={12} />
              {session.username}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>
              {session.baseUrl.replace(/^https?:\/\//, '')}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171', borderRadius: 10 }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="animate-fade-down" style={{
          padding: '16px 28px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(10, 18, 37, 0.9) 0%, rgba(2, 6, 23, 0.6) 100%)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
            {tab === 'files' ? 'File Manager' : tab}
          </h2>
          <button onClick={loadData} className="btn btn-ghost" disabled={loading} style={{ borderRadius: 10 }}>
            <RefreshCw size={16} className={loading ? 'spinner' : ''} />
            Refresh
          </button>
        </header>

        <div className="animate-slide" style={{
          flex: 1,
          overflow: 'auto',
          padding: 28,
          background: 'radial-gradient(ellipse at top right, rgba(37, 99, 235, 0.06) 0%, transparent 50%), var(--bg)'
        }}>
          {loading && !config ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : (
            <>
              {tab === 'overview' && <Overview config={config} usage={usage} />}
              {tab === 'domains' && <Domains />}
              {tab === 'subdomains' && <Subdomains domains={domainStr} />}
              {tab === 'emails' && <Emails domains={domainStr} />}
              {tab === 'databases' && <Databases />}
              {tab === 'ftp' && <Ftp domains={domainStr} />}
              {tab === 'files' && <FileManager />}
              {tab === 'admin' && session.role !== 'user' && <Admin session={session} />}
              {tab === 'settings' && <Settings />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
