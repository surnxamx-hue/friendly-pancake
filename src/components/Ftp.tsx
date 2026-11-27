import { useState, useEffect } from 'react'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
import { DA } from '../api'

interface Props {
  domains: string
}

export default function Ftp({ domains }: Props) {
  const domainList = domains ? String(domains).split(',').filter(Boolean) : []
  const [selectedDomain, setSelectedDomain] = useState(domainList[0] || '')
  const [accounts, setAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState('')
  const [passwd, setPasswd] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!selectedDomain) return
    setLoading(true)
    setError('')
    try {
      const res = await DA.listFtp(selectedDomain)
      if (res.error) {
        setError(res.message || 'Failed to load FTP accounts')
        setAccounts([])
      } else {
        let list: string[] = []
        if (res.list) {
          list = String(res.list).split(',').filter(Boolean)
        } else {
          list = Object.keys(res).filter(k => !['error', 'text', 'domain'].includes(k))
        }
        setAccounts(list)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (domainList.length && !selectedDomain) setSelectedDomain(domainList[0])
  }, [domains])

  useEffect(() => { load() }, [selectedDomain])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !passwd || !selectedDomain) return
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createFtp(selectedDomain, user, passwd)
      if (res.error) {
        setError(res.message || 'Failed to create FTP account')
      } else {
        setMessage(`Created FTP user: ${user}`)
        setUser('')
        setPasswd('')
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (ftpUser: string) => {
    if (!confirm(`Delete FTP account "${ftpUser}"?`)) return
    try {
      const res = await DA.deleteFtp(selectedDomain, ftpUser)
      if (res.error) {
        setError(res.message || 'Failed to delete')
      } else {
        setMessage(`Deleted FTP user: ${ftpUser}`)
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <label className="label" style={{ margin: 0 }}>Domain:</label>
        <select className="input" style={{ width: 280 }} value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
          {domainList.map(d => <option key={d} value={d}>{d}</option>)}
          {domainList.length === 0 && <option value="">No domains</option>}
        </select>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create FTP Account</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 140 }} placeholder="ftp username" value={user} onChange={e => setUser(e.target.value)} />
          <input className="input" style={{ flex: 1, minWidth: 140 }} type="password" placeholder="password" value={passwd} onChange={e => setPasswd(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={creating || !user || !passwd}>
            {creating ? <div className="spinner" /> : <><Plus size={16} /> Create</>}
          </button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          FTP server: ftp.{selectedDomain || 'yourdomain.com'}
        </p>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FolderOpen size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No FTP accounts found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>FTP Username</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(u => (
                <tr key={u}>
                  <td style={{ fontWeight: 500 }}>{u}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ color: '#f87171', padding: '6px 10px' }} onClick={() => handleDelete(u)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
