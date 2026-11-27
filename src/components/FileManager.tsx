import { useEffect, useState } from 'react'
import {
  Folder, File, ChevronRight, ArrowUp, Plus, Trash2,
  RefreshCw, FolderPlus, FilePlus, Home, Upload, Download,
  Pencil, Copy, X, Save
} from 'lucide-react'
import { DA, daError, type DAFileEntry } from '../api'
import { joinRemotePath, type DAResponse } from '../lib/da'

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<DAFileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const applyResult = (res: DAResponse, successMessage: string): boolean => {
    const problem = daError(res)
    if (problem) {
      setError(problem)
      return false
    }
    setMessage(successMessage)
    setError('')
    return true
  }

  const load = async (targetPath = currentPath) => {
    setLoading(true)
    setError('')
    setSelected(new Set())
    try {
      const res = await DA.listFiles(targetPath)
      const problem = daError(res)
      if (problem) {
        setError(problem)
        setFiles([])
      } else {
        setFiles(DA.parseFiles(res))
      }
    } catch (err: any) {
      setError(err?.message || 'โหลดรายการไฟล์ไม่สำเร็จ')
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
    setCurrentPath(joinRemotePath(currentPath, name))
  }

  const toggleSelect = (name: string) => {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelected(next)
  }

  const selectedFile = files.find(file => selected.has(file.name) && file.type === 'file') ?? null

  const handleCreateFolder = async () => {
    if (!newName.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createFolder(currentPath, newName.trim())
      if (applyResult(res, `สร้างโฟลเดอร์ ${newName.trim()} สำเร็จ`)) {
        setNewName('')
        setShowNewFolder(false)
        await load()
      }
    } catch (err: any) {
      setError(err?.message || 'สร้างโฟลเดอร์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateFile = async () => {
    if (!newName.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.createFile(currentPath, newName.trim(), '')
      if (applyResult(res, `สร้างไฟล์ ${newName.trim()} สำเร็จ`)) {
        setNewName('')
        setShowNewFile(false)
        await load()
      }
    } catch (err: any) {
      setError(err?.message || 'สร้างไฟล์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (selected.size === 0 || !window.confirm(`ลบ ${selected.size} รายการ?`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await DA.deleteFiles(currentPath, Array.from(selected))
      if (applyResult(res, `ลบ ${selected.size} รายการสำเร็จ`)) await load()
    } catch (err: any) {
      setError(err?.message || 'ลบไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const file = await DA.pickLocalFile()
      if (!file) return
      const res = await DA.uploadFile(currentPath, file)
      if (applyResult(res, `อัปโหลด ${file.name} สำเร็จ`)) await load()
    } catch (err: any) {
      setError(err?.message || 'อัปโหลดไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedFile) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const remote = joinRemotePath(currentPath, selectedFile.name)
      const result = await DA.readRemoteFile(remote)
      const saved = await DA.saveLocalFile(selectedFile.name, result.base64, 'base64')
      if (saved) setMessage(`ดาวน์โหลด ${selectedFile.name} สำเร็จ`)
      else setError('ยกเลิกการบันทึกไฟล์')
    } catch (err: any) {
      setError(err?.message || 'ดาวน์โหลดไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const openEditor = async () => {
    if (!selectedFile) return
    setBusy(true)
    setError('')
    try {
      const remote = joinRemotePath(currentPath, selectedFile.name)
      const result = await DA.readRemoteFile(remote)
      setEditTarget(selectedFile.name)
      setEditContent(result.text)
    } catch (err: any) {
      setError(err?.message || 'เปิดไฟล์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async () => {
    if (!editTarget) return
    setBusy(true)
    setError('')
    try {
      const res = await DA.saveFileContent(currentPath, editTarget, editContent)
      if (applyResult(res, `บันทึก ${editTarget} สำเร็จ`)) {
        setEditTarget(null)
        await load()
      }
    } catch (err: any) {
      setError(err?.message || 'บันทึกไฟล์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const handleRenameOrCopy = async (action: 'rename' | 'copy') => {
    if (!selectedFile) return
    const nextName = window.prompt(
      action === 'rename' ? 'ชื่อใหม่:' : 'คัดลอกไปไฟล์ชื่อ:',
      selectedFile.name
    )
    if (!nextName || nextName === selectedFile.name) return

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = action === 'rename'
        ? await DA.renameFile(currentPath, selectedFile.name, nextName)
        : await DA.copyFile(currentPath, selectedFile.name, nextName)
      if (applyResult(res, `${action === 'rename' ? 'เปลี่ยนชื่อ' : 'คัดลอก'}สำเร็จ`)) await load()
    } catch (err: any) {
      setError(err?.message || 'ทำรายการไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const breadcrumbs = currentPath === '/'
    ? ['/']
    : ['/', ...currentPath.replace(/^\//, '').split('/')]

  return (
    <div>
      <div className="animate-fade-down" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
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

        <button className="btn btn-ghost" onClick={handleUpload} disabled={busy}>
          <Upload size={16} /> Upload
        </button>
        <button className="btn btn-ghost" onClick={handleDownload} disabled={busy || !selectedFile}>
          <Download size={16} /> Download
        </button>
        <button className="btn btn-ghost" onClick={openEditor} disabled={busy || !selectedFile}>
          <Pencil size={16} /> Edit
        </button>
        <button className="btn btn-ghost" onClick={() => handleRenameOrCopy('rename')} disabled={busy || !selectedFile}>
          <Pencil size={16} /> Rename
        </button>
        <button className="btn btn-ghost" onClick={() => handleRenameOrCopy('copy')} disabled={busy || !selectedFile}>
          <Copy size={16} /> Copy
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        <button className="btn btn-ghost" onClick={() => { setShowNewFolder(true); setShowNewFile(false); setNewName('') }}>
          <FolderPlus size={16} /> New Folder
        </button>
        <button className="btn btn-ghost" onClick={() => { setShowNewFile(true); setShowNewFolder(false); setNewName('') }}>
          <FilePlus size={16} /> New File
        </button>

        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={handleDelete} disabled={busy} style={{ marginLeft: 'auto' }}>
            <Trash2 size={16} /> Delete ({selected.size})
          </button>
        )}
      </div>

      <div className="card animate-fade-down" style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, flexWrap: 'wrap' }}>
        {breadcrumbs.map((part, index) => {
          const pathToHere = index === 0 ? '/' : '/' + breadcrumbs.slice(1, index + 1).join('/')
          return (
            <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {index > 0 && <ChevronRight size={14} color="var(--text-muted)" />}
              <button
                onClick={() => setCurrentPath(pathToHere)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--primary)',
                  fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
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

      {(showNewFolder || showNewFile) && (
        <div className="card animate-slide" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder={showNewFolder ? 'Folder name' : 'File name (e.g. index.html)'}
            value={newName}
            onChange={event => setNewName(event.target.value)}
            autoFocus
            onKeyDown={event => {
              if (event.key === 'Enter') {
                if (showNewFolder) void handleCreateFolder()
                else void handleCreateFile()
              }
              if (event.key === 'Escape') { setShowNewFolder(false); setShowNewFile(false) }
            }}
          />
          <button
            className="btn btn-primary"
            disabled={busy || !newName.trim()}
            onClick={showNewFolder ? handleCreateFolder : handleCreateFile}
          >
            <Plus size={16} /> Create
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

      <div className="card animate-slide" style={{ padding: 0, overflow: 'hidden' }}>
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
                <th style={{ width: 110 }}>Size</th>
                <th style={{ width: 80 }}>Perm</th>
                <th style={{ width: 170 }}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr
                  key={file.name}
                  style={{ cursor: file.type === 'dir' ? 'pointer' : 'default' }}
                  onDoubleClick={() => file.type === 'dir' && enterDir(file.name)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(file.name)}
                      onChange={() => toggleSelect(file.name)}
                      onClick={event => event.stopPropagation()}
                    />
                  </td>
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                      onClick={() => file.type === 'dir' && enterDir(file.name)}
                    >
                      {file.type === 'dir'
                        ? <Folder size={18} color="#f59e0b" />
                        : <File size={18} color="#94a3b8" />}
                      <span style={{ fontWeight: file.type === 'dir' ? 500 : 400 }}>{file.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {file.type === 'dir' ? '—' : file.size}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>
                    {file.perm}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{file.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24
        }}>
          <div className="card animate-modal" style={{ width: 'min(900px, 95vw)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Edit · {editTarget}</h3>
              <button className="btn btn-ghost" onClick={() => setEditTarget(null)} style={{ marginLeft: 'auto' }}>
                <X size={18} />
              </button>
            </div>
            <textarea
              className="input"
              style={{ flex: 1, minHeight: 420, fontFamily: 'monospace', fontSize: 13, resize: 'none' }}
              value={editContent}
              onChange={event => setEditContent(event.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="btn btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={busy}>
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        ดับเบิลคลิกโฟลเดอร์เพื่อเปิด · Upload/Download/Edit ทำงานผ่าน DirectAdmin API
      </p>
    </div>
  )
}
