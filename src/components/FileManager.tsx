import { useState, useEffect } from 'react'
import { 
  Folder, File, ChevronRight, ArrowUp, Plus, Trash2, 
  RefreshCw, FolderPlus, FilePlus, Home
} from 'lucide-react'
import { DA } from '../api'

interface FileEntry {
  name: string
  type: 'file' | 'dir'
  size?: string
  perm?: string
  date?: string
}

function parseFileList(res: any): FileEntry[] {
  const entries: FileEntry[] = []
  if (!res || res.error) return entries

  // Response format from CMD_API_FILE_MANAGER:
  // path/file=path=name&type=file|dir&size=...&showsize=...&perm=...&date=...
  for (const [key, value] of Object.entries(res)) {
    if (['error', 'text', 'path'].includes(key)) continue
    if (typeof value !== 'string') continue

    const params: Record<string, string> = {}
    value.split('&').forEach(pair => {
      const [k, ...rest] = pair.split('=')
      if (k) params[k] = decodeURIComponent(rest.join('=') || '')
    })

    const name = params.name || key.split('/').pop() || key
    if (name === '.' || name === '..') continue

    entries.push({
      name,
      type: params.type === 'dir' ? 'dir' : 'file',
      size: params.showsize || params.size,
      perm: params.perm,
      date: params.date ? new Date(Number(params.date) * 1000).toLocaleString() : undefined
    })
  }

  // Sort: folders first, then by name
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return entries
}

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async (path = currentPath) => {
    setLoading(true)
    setError('')
    setSelected(new Set())
    try {
      const res = await DA.listFiles(path)
      if (res.error) {
        setError(res.message || res.text || 'Failed to list files')
        setFiles([])
      } else {
        setFiles(parseFileList(res))
      }
    } catch (e: any) {
      setError(e.message || 'Network error')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(currentPath)
  }, [currentPath])

  const goUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.replace(/\/$/, '').split('/')
    parts.pop()
    setCurrentPath(parts.join('/') || '/')
  }

  const enterDir = (name: string) => {
    const next = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    setCurrentPath(next)
  }

  const toggleSelect = (name: string) => {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelected(next)
  }

  const handleCreateFolder = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createFolder(currentPath, newName.trim())
      if (res.error) {
        setError(res.message || res.text || 'Failed to create folder')
      } else {
        setMessage(`Folder "${newName}" created`)
        setNewName('')
        setShowNewFolder(false)
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateFile = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createFile(currentPath, newName.trim(), '')
      if (res.error) {
        setError(res.message || res.text || 'Failed to create file')
      } else {
        setMessage(`File "${newName}" created`)
        setNewName('')
        setShowNewFile(false)
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} item(s)?`)) return
    setError('')
    setMessage('')
    try {
      const res = await DA.deleteFiles(currentPath, Array.from(selected))
      if (res.error) {
        setError(res.message || res.text || 'Failed to delete')
      } else {
        setMessage(`Deleted ${selected.size} item(s)`)
        await load()
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const breadcrumbs = currentPath === '/' 
    ? ['/'] 
    : ['/', ...currentPath.replace(/^\//, '').split('/')]

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-ghost" onClick={() => setCurrentPath('/')} title="Home">
          <Home size={16} />
        </button>
        <button className="btn btn-ghost" onClick={goUp} disabled={currentPath === '/'} title="Up">
          <ArrowUp size={16} />
        </button>
        <button className="btn btn-ghost" onClick={() => load()} title="Refresh">
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        <button className="btn btn-ghost" onClick={() => { setShowNewFolder(true); setShowNewFile(false); setNewName('') }}>
          <FolderPlus size={16} /> New Folder
        </button>
        <button className="btn btn-ghost" onClick={() => { setShowNewFile(true); setShowNewFolder(false); setNewName('') }}>
          <FilePlus size={16} /> New File
        </button>

        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={handleDelete} style={{ marginLeft: 'auto' }}>
            <Trash2 size={16} /> Delete ({selected.size})
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="card" style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, flexWrap: 'wrap' }}>
        {breadcrumbs.map((part, i) => {
          const pathToHere = i === 0 ? '/' : '/' + breadcrumbs.slice(1, i + 1).join('/')
          return (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <ChevronRight size={14} color="var(--text-muted)" />}
              <button
                onClick={() => setCurrentPath(pathToHere)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--primary)',
                  fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                {part === '/' ? 'root' : part}
              </button>
            </span>
          )
        })}
      </div>

      {/* New folder / file form */}
      {(showNewFolder || showNewFile) && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder={showNewFolder ? 'Folder name' : 'File name (e.g. index.html)'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') showNewFolder ? handleCreateFolder() : handleCreateFile()
              if (e.key === 'Escape') { setShowNewFolder(false); setShowNewFile(false) }
            }}
          />
          <button
            className="btn btn-primary"
            disabled={creating || !newName.trim()}
            onClick={showNewFolder ? handleCreateFolder : handleCreateFile}
          >
            {creating ? <div className="spinner" /> : <><Plus size={16} /> Create</>}
          </button>
          <button className="btn btn-ghost" onClick={() => { setShowNewFolder(false); setShowNewFile(false) }}>
            Cancel
          </button>
        </div>
      )}

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

      {/* File list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
          </div>
        ) : files.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Folder size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>This folder is empty</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Name</th>
                <th style={{ width: 100 }}>Size</th>
                <th style={{ width: 80 }}>Perm</th>
                <th style={{ width: 160 }}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr
                  key={f.name}
                  style={{ cursor: f.type === 'dir' ? 'pointer' : 'default' }}
                  onDoubleClick={() => f.type === 'dir' && enterDir(f.name)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(f.name)}
                      onChange={() => toggleSelect(f.name)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                      onClick={() => f.type === 'dir' && enterDir(f.name)}
                    >
                      {f.type === 'dir' 
                        ? <Folder size={18} color="#f59e0b" /> 
                        : <File size={18} color="#94a3b8" />
                      }
                      <span style={{ fontWeight: f.type === 'dir' ? 500 : 400 }}>{f.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{f.type === 'dir' ? '—' : (f.size || '—')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>{f.perm || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{f.date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        Double-click a folder to open it. Select items and click Delete to remove.
        Binary download/upload works best via FTP for large files.
      </p>
    </div>
  )
}
