import { useState, useEffect } from 'react'
import { Plus, Trash2, Globe } from 'lucide-react'
import { DA } from '../api'

export default function Domains() {
  const [domains, setDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await DA.listDomains()
      if (res.error) {
        setError(res.message || 'Failed to load domains')
        setDomains([])
      } else {
        // Response is usually { list: "domain1.com,domain2.com" } or key=value pairs of domains
        let list: string[] = []
        if (res.list) {
          list = String(res.list).split(',').filter(Boolean)
        } else {
          // Sometimes each domain is a key
          list = Object.keys(res).filter(k => k.includes('.') && !['error', 'text'].includes(k))
        }
        setDomains(list)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) return
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createDomain(newDomain.trim())
      if (res.error) {
        setError(res.message || 'Failed to create domain')
      } else {
        setMessage(`Domain ${newDomain} created successfully`)
        setNewDomain('')
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (domain: string) => {
    if (!confirm(`Delete domain "${domain}" and all its data? This cannot be undone.`)) return
    setError('')
    setMessage('')
    try {
      const res = await DA.deleteDomain(domain)
      if (res.error) {
        setError(res.message || 'Failed to delete domain')
      } else {
        setMessage(`Domain ${domain} deleted`)
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add Domain</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="example.com"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={creating || !newDomain.trim()}>
            {creating ? <div className="spinner" /> : <><Plus size={16} /> Create</>}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {message}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : domains.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Globe size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No domains found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Domain</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(d => (
                <tr key={d}>
                  <td style={{ fontWeight: 500 }}>{d}</td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ color: '#f87171', padding: '6px 10px' }}
                      onClick={() => handleDelete(d)}
                      title="Delete domain"
                    >
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
