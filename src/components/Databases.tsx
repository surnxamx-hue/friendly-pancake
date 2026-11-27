import { useState, useEffect } from 'react'
import { Plus, Trash2, Database } from 'lucide-react'
import { DA } from '../api'

export default function Databases() {
  const [dbs, setDbs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [user, setUser] = useState('')
  const [passwd, setPasswd] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await DA.listDatabases()
      if (res.error) {
        setError(res.message || 'Failed to load databases')
        setDbs([])
      } else {
        let list: string[] = []
        if (res.list) {
          list = String(res.list).split(',').filter(Boolean)
        } else {
          list = Object.keys(res).filter(k => !['error', 'text'].includes(k))
        }
        setDbs(list)
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
    if (!name || !user || !passwd) return
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createDatabase(name, user, passwd)
      if (res.error) {
        setError(res.message || 'Failed to create database')
      } else {
        setMessage(`Database ${name} created`)
        setName('')
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

  const handleDelete = async (dbName: string) => {
    if (!confirm(`Delete database "${dbName}"?`)) return
    try {
      const res = await DA.deleteDatabase(dbName)
      if (res.error) {
        setError(res.message || 'Failed to delete')
      } else {
        setMessage(`Deleted ${dbName}`)
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create Database</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12 }}>
          <input className="input" placeholder="Database name" value={name} onChange={e => setName(e.target.value)} />
          <input className="input" placeholder="DB Username" value={user} onChange={e => setUser(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={passwd} onChange={e => setPasswd(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={creating || !name || !user || !passwd}>
            {creating ? <div className="spinner" /> : <><Plus size={16} /> Create</>}
          </button>
        </form>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : dbs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Database size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No databases found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Database Name</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dbs.map(db => (
                <tr key={db}>
                  <td style={{ fontWeight: 500 }}>{db}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ color: '#f87171', padding: '6px 10px' }} onClick={() => handleDelete(db)}>
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
