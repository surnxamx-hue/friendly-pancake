import { HardDrive, Wifi, Database, Mail, Globe, Server } from 'lucide-react'

interface Props {
  config: any
  usage: any
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card" style={{
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
      background: 'linear-gradient(145deg, rgba(15, 28, 51, 0.98) 0%, rgba(8, 15, 30, 0.95) 100%)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${color}15`
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 16px ${color}25`
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

function formatMB(val: any) {
  if (val === undefined || val === null) return '—'
  const n = Number(val)
  if (isNaN(n)) return String(val)
  if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`
  return `${n} MB`
}

export default function Overview({ config, usage }: Props) {
  if (!config) {
    return <div style={{ color: 'var(--text-muted)' }}>Unable to load account information.</div>
  }

  const domain = config.domain || config.domains || '—'
  const bandwidth = usage?.bandwidth || config.bandwidth
  const quota = usage?.quota || config.quota

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="animate-in stagger-1"><StatCard icon={Globe} label="Main Domain" value={domain} color="#3b82f6" /></div>
        <div className="animate-in stagger-2"><StatCard icon={HardDrive} label="Disk Usage" value={formatMB(quota)} sub={config.quota ? `Limit: ${formatMB(config.quota)}` : undefined} color="#22c55e" /></div>
        <div className="animate-in stagger-3"><StatCard icon={Wifi} label="Bandwidth" value={formatMB(bandwidth)} sub={config.bandwidth ? `Limit: ${formatMB(config.bandwidth)}` : undefined} color="#f59e0b" /></div>
        <div className="animate-in stagger-4"><StatCard icon={Mail} label="Email Accounts" value={config.nemailf || config.email || '—'} sub={`Limit: ${config.nemail || '—'}`} color="#a855f7" /></div>
        <div className="animate-in stagger-5"><StatCard icon={Database} label="MySQL Databases" value={config.mysql || '—'} sub={`Limit: ${config.mysql || '—'}`} color="#06b6d4" /></div>
        <div className="animate-in stagger-6"><StatCard icon={Server} label="IP Address" value={config.ip || '—'} color="#64748b" /></div>
      </div>

      <div className="card" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(37,99,235,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, letterSpacing: '-0.01em' }}>Account Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', fontSize: 14 }}>
          {[
            ['Username', config.username || config.user],
            ['Email', config.email],
            ['Package', config.package],
            ['PHP Version', config.php1_select || config.php],
            ['SSH Access', config.ssh === 'ON' ? 'Enabled' : 'Disabled'],
            ['SSL', config.ssl === 'ON' ? 'Enabled' : 'Disabled'],
            ['CGI', config.cgi === 'ON' ? 'Enabled' : 'Disabled'],
            ['DNS Control', config.dnscontrol === 'ON' ? 'Enabled' : 'Disabled'],
            ['Virtual Domains', config.vdomains],
            ['Subdomains', config.nsubdomains],
            ['FTP Accounts', config.ftp],
            ['Domain Pointers', config.domainptr],
          ].map(([label, value]) => (
            <div key={label as string} style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
              paddingBottom: 10
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
