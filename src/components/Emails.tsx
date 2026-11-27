import { useState, useEffect } from 'react'
import { Plus, Trash2, Mail } from 'lucide-react'
import { DA } from '../api'

interface Props {
  domains: string
}

export default function Emails({ domains }: Props) {
  const domainList = domains ? String(domains).split(',').filter(Boolean) : []
  const [selectedDomain, setSelectedDomain] = useState(domainList[0] || '')
  const [emails, setEmails] = useState<string[]>([])
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
      const res = await DA.listEmails(selectedDomain)
      if (res.error) {
        setError(res.message || 'Failed to load emails')
        setEmails([])
      } else {
        // Usually list of users as keys or a list string
        let list: string[] = []
        if (Array.isArray(res)) {
          list = res
        } else if (res.list) {
          list = String(res.list).split(',').filter(Boolean)
        } else {
          list = Object.keys(res).filter(k => !['error', 'text', 'domain'].includes(k) && !k.startsWith('quota'))
        }
        setEmails(list)
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
      const res = await DA.createEmail(selectedDomain, user, passwd)
      if (res.error) {
        setError(res.message || 'Failed to create email')
      } else {
        setMessage(`Created ${user}@${selectedDomain}`)
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

  const handleDelete = async (emailUser: string) => {
    if (!confirm(`Delete ${emailUser}@${selectedDomain}?`)) return
    try {
      const res = await DA.deleteEmail(selectedDomain, emailUser)
      if (res.error) {
        setError(res.message || 'Failed to delete')
      } else {
        setMessage(`Deleted ${emailUser}@${selectedDomain}`)
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
        <select
          className="input"
          style={{ width: 280 }}
          value={selectedDomain}
          onChange={e => setSelectedDomain(e.target.value)}
        >
          {domainList.map(d => <option key={d} value={d}>{d}</option>)}
          {domainList.length === 0 && <option value="">No domains</option>}
        </select>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create Email Account</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <input
              className="input"
              placeholder="username"
              value={user}
              onChange={e => setUser(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>@{selectedDomain}</div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <input
              className="input"
              type="password"
              placeholder="password"
              value={passwd}
              onChange={e => setPasswd(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating || !user || !passwd}>
            {creating ? <div className="spinner" /> : <><Plus size={16} /> Create</>}
          </button>
        </form>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : emails.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Mail size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No email accounts found for this domain</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email Address</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emails.map(u => (
                <tr key={u}>
                  <td style={{ fontWeight: 500 }}>{u}@{selectedDomain}</td>
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
