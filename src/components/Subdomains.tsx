import { useState, useEffect } from 'react'
import { Plus, Trash2, Network } from 'lucide-react'
import { DA } from '../api'

interface Props {
  domains: string
}

export default function Subdomains({ domains }: Props) {
  const domainList = domains ? String(domains).split(',').filter(Boolean) : []
  const [selectedDomain, setSelectedDomain] = useState(domainList[0] || '')
  const [subs, setSubs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [subName, setSubName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!selectedDomain) return
    setLoading(true)
    setError('')
    try {
      const res = await DA.listSubdomains(selectedDomain)
      if (res.error) {
        setError(res.message || 'Failed to load subdomains')
        setSubs([])
      } else {
        let list: string[] = []
        if (res.list) {
          list = String(res.list).split(',').filter(Boolean)
        } else {
          list = Object.keys(res).filter(k => !['error', 'text', 'domain'].includes(k))
        }
        setSubs(list)
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
    if (!subName.trim() || !selectedDomain) return
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createSubdomain(selectedDomain, subName.trim())
      if (res.error) {
        setError(res.message || 'Failed to create subdomain')
      } else {
        setMessage(`Created ${subName}.${selectedDomain}`)
        setSubName('')
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (sub: string) => {
    if (!confirm(`Delete subdomain "${sub}.${selectedDomain}"?`)) return
    try {
      const res = await DA.deleteSubdomain(selectedDomain, sub)
      if (res.error) {
        setError(res.message || 'Failed to delete')
      } else {
        setMessage(`Deleted ${sub}.${selectedDomain}`)
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
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create Subdomain</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input className="input" style={{ width: 180 }} placeholder="blog" value={subName} onChange={e => setSubName(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>.{selectedDomain || 'example.com'}</span>
          <button type="submit" className="btn btn-primary" disabled={creating || !subName.trim()}>
            {creating ? <div className="spinner" /> : <><Plus size={16} /> Create</>}
          </button>
        </form>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : subs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Network size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No subdomains found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Subdomain</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s}>
                  <td style={{ fontWeight: 500 }}>{s}.{selectedDomain}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ color: '#f87171', padding: '6px 10px' }} onClick={() => handleDelete(s)}>
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
