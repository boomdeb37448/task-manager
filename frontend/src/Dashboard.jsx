import { useState, useEffect, useRef } from 'react';
import './Dashboard.css';

// ── Service metadata ───────────────────────────────────────────────────────────
const SERVICE_MAP = {
  frontend: { color: '#60a5fa', label: 'Frontend',   desc: 'React + Nginx',       role: 'Web Server'  },
  backend:  { color: '#a78bfa', label: 'Backend',    desc: 'Node.js + Express',   role: 'API Server'  },
  postgres: { color: '#34d399', label: 'PostgreSQL', desc: 'PostgreSQL 16',        role: 'Database'    },
  redis:    { color: '#f59e0b', label: 'Redis',      desc: 'Redis 7',              role: 'Cache'       },
};

function getServiceKey(name) {
  if (!name) return null;
  if (name.includes('frontend')) return 'frontend';
  if (name.includes('backend'))  return 'backend';
  if (name.includes('postgres')) return 'postgres';
  if (name.includes('redis'))    return 'redis';
  return null;
}

function getDeployName(container) {
  if (container.runtime === 'kubernetes') {
    return getServiceKey(container.name) || container.name.split('-')[0];
  }
  return container.name;
}

// ── SVG gradients / arrowhead ──────────────────────────────────────────────────
function Defs() {
  return (
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.3)" />
      </marker>
      <linearGradient id="gFront" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" /><stop offset="100%" stopColor="#60a5fa" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="gBack" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="gPg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" /><stop offset="100%" stopColor="#34d399" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="gRedis" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="gIngress" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" stopOpacity="0.25" /><stop offset="100%" stopColor="#fb923c" stopOpacity="0.08" />
      </linearGradient>
    </defs>
  );
}

// ── Docker architecture diagram ────────────────────────────────────────────────
function DockerDiagram({ stateOf, dot, shadow }) {
  return (
    <svg className="diagram-svg" viewBox="0 0 520 340" fill="none">
      <Defs />
      <rect x="195" y="8" width="130" height="36" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="260" y="30" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">Browser / Client</text>
      <line x1="260" y1="44" x2="260" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="170" y="64" width="180" height="68" rx="14" fill="url(#gFront)" stroke="#60a5fa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="194" cy="81" r="6" fill={dot(stateOf('frontend'))} style={{ filter: shadow(stateOf('frontend')) }} />
      <text x="210" y="86" className="node-label" fontSize="13" fill="#fff">Frontend</text>
      <text x="194" y="102" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">React + Nginx  ·  Port 3000</text>
      <text x="194" y="122" className="node-sublabel" fontSize="10" fill="#60a5fa">task-manager-frontend</text>
      <line x1="260" y1="132" x2="260" y2="170" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="170" y="172" width="180" height="68" rx="14" fill="url(#gBack)" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="194" cy="189" r="6" fill={dot(stateOf('backend'))} style={{ filter: shadow(stateOf('backend')) }} />
      <text x="210" y="194" className="node-label" fontSize="13" fill="#fff">Backend</text>
      <text x="194" y="210" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">Node.js + Express  ·  Port 5000</text>
      <text x="194" y="230" className="node-sublabel" fontSize="10" fill="#a78bfa">task-manager-backend</text>
      <line x1="220" y1="240" x2="120" y2="276" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <line x1="300" y1="240" x2="400" y2="276" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="30" y="278" width="180" height="54" rx="14" fill="url(#gPg)" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="54" cy="295" r="6" fill={dot(stateOf('postgres'))} style={{ filter: shadow(stateOf('postgres')) }} />
      <text x="70" y="300" className="node-label" fontSize="13" fill="#fff">PostgreSQL</text>
      <text x="54" y="317" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">postgres:16  ·  Port 5432</text>
      <rect x="310" y="278" width="180" height="54" rx="14" fill="url(#gRedis)" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="334" cy="295" r="6" fill={dot(stateOf('redis'))} style={{ filter: shadow(stateOf('redis')) }} />
      <text x="350" y="300" className="node-label" fontSize="13" fill="#fff">Redis</text>
      <text x="334" y="317" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">redis:7  ·  Port 6379</text>
    </svg>
  );
}

// ── Kubernetes architecture diagram ────────────────────────────────────────────
function K8sDiagram({ stateOf, dot, shadow }) {
  return (
    <svg className="diagram-svg" viewBox="0 0 520 476" fill="none">
      <Defs />
      <rect x="195" y="8" width="130" height="36" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="260" y="30" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">Browser / Client</text>
      <line x1="260" y1="44" x2="260" y2="66" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="210" y="48" width="100" height="14" rx="4" fill="rgba(251,146,60,0.2)" stroke="#fb923c" strokeWidth="0.8" />
      <text x="260" y="58" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fb923c">NodePort :8080</text>
      <rect x="140" y="68" width="240" height="46" rx="12" fill="url(#gIngress)" stroke="#fb923c" strokeWidth="1.2" strokeOpacity="0.6" />
      <circle cx="164" cy="87" r="6" fill="#fb923c" style={{ filter: 'drop-shadow(0 0 6px #fb923c)' }} />
      <text x="180" y="92" className="node-label" fontSize="13" fill="#fff">Ingress Controller</text>
      <text x="164" y="107" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">nginx  ·  ns: ingress-nginx</text>
      <line x1="260" y1="114" x2="260" y2="150" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="8" y="128" width="504" height="336" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="8 4" />
      <text x="22" y="144" fontSize="9.5" fontWeight="700" fill="rgba(255,255,255,0.35)" letterSpacing="1">NAMESPACE: task-manager</text>
      <rect x="160" y="152" width="200" height="88" rx="14" fill="url(#gFront)" stroke="#60a5fa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="184" cy="172" r="6" fill={dot(stateOf('frontend'))} style={{ filter: shadow(stateOf('frontend')) }} />
      <text x="200" y="177" className="node-label" fontSize="13" fill="#fff">Frontend Pod</text>
      <text x="184" y="194" className="node-sublabel" fontSize="10" fill="rgba(255,255,255,0.45)">React + Nginx  ·  Port 80</text>
      <text x="184" y="211" className="node-sublabel" fontSize="9.5" fill="#60a5fa">svc: frontend  (ClusterIP)</text>
      <text x="184" y="227" className="node-sublabel" fontSize="9" fill="rgba(255,255,255,0.2)">task-manager-frontend</text>
      <line x1="260" y1="240" x2="260" y2="268" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="160" y="270" width="200" height="88" rx="14" fill="url(#gBack)" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="184" cy="290" r="6" fill={dot(stateOf('backend'))} style={{ filter: shadow(stateOf('backend')) }} />
      <text x="200" y="295" className="node-label" fontSize="13" fill="#fff">Backend Pod</text>
      <text x="184" y="312" className="node-sublabel" fontSize="10" fill="rgba(255,255,255,0.45)">Node.js + Express  ·  Port 5000</text>
      <text x="184" y="329" className="node-sublabel" fontSize="9.5" fill="#a78bfa">svc: backend  (ClusterIP)</text>
      <text x="184" y="345" className="node-sublabel" fontSize="9" fill="rgba(255,255,255,0.2)">task-manager-backend</text>
      <line x1="360" y1="314" x2="374" y2="314" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 2" />
      <rect x="374" y="286" width="118" height="56" rx="8" fill="rgba(167,139,250,0.08)" stroke="#a78bfa" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="433" y="302" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a78bfa">HPA</text>
      <text x="433" y="316" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.45)">min: 1  ·  max: 3</text>
      <text x="433" y="330" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">target CPU: 50%</text>
      <line x1="210" y1="358" x2="117" y2="392" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <line x1="310" y1="358" x2="403" y2="392" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="22" y="394" width="190" height="64" rx="14" fill="url(#gPg)" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="46" cy="412" r="6" fill={dot(stateOf('postgres'))} style={{ filter: shadow(stateOf('postgres')) }} />
      <text x="62" y="417" className="node-label" fontSize="13" fill="#fff">PostgreSQL Pod</text>
      <text x="46" y="433" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">postgres:16  ·  Port 5432</text>
      <text x="46" y="448" className="node-sublabel" fontSize="9" fill="#34d399">svc: postgres  (ClusterIP)</text>
      <rect x="308" y="394" width="190" height="64" rx="14" fill="url(#gRedis)" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="332" cy="412" r="6" fill={dot(stateOf('redis'))} style={{ filter: shadow(stateOf('redis')) }} />
      <text x="348" y="417" className="node-label" fontSize="13" fill="#fff">Redis Pod</text>
      <text x="332" y="433" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">redis:7  ·  Port 6379</text>
      <text x="332" y="448" className="node-sublabel" fontSize="9" fill="#f59e0b">svc: redis  (ClusterIP)</text>
    </svg>
  );
}

function ArchDiagram({ containers, runtime }) {
  const stateOf = (key) => containers.find((c) => getServiceKey(c.name) === key)?.state === 'running';
  const dot     = (r) => r ? '#34d399' : '#f87171';
  const shadow  = (r) => r ? 'drop-shadow(0 0 8px #34d399)' : 'none';
  if (runtime === 'kubernetes') return <K8sDiagram stateOf={stateOf} dot={dot} shadow={shadow} />;
  return <DockerDiagram stateOf={stateOf} dot={dot} shadow={shadow} />;
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ── Pod card ──────────────────────────────────────────────────────────────────
function PodCard({ container, onRestart, onLogs, restarting }) {
  const key    = getServiceKey(container.name);
  const svc    = SERVICE_MAP[key] || {};
  const accent = svc.color || '#a78bfa';
  const isRunning = container.state === 'running';
  const isK8s = container.runtime === 'kubernetes';
  const displayName = svc.label || (isK8s ? container.name.split('-')[0] : container.name);

  return (
    <div className="pod-card" style={{ '--accent': accent, borderColor: isRunning ? `${accent}35` : 'rgba(248,113,113,0.25)' }}>

      {/* Header */}
      <div className="pod-header">
        <div className="pod-title-row">
          <span className={`pod-dot ${isRunning ? 'running' : 'stopped'}`} />
          <span className="pod-name" style={{ color: accent }}>{displayName}</span>
        </div>
        <span className={`state-pill ${isRunning ? 'running' : 'stopped'}`}>{container.state}</span>
      </div>

      {/* Badges */}
      <div className="pod-badges">
        <span className={`chip runtime ${isK8s ? 'k8s' : 'docker'}`}>{isK8s ? 'K8s Pod' : 'Docker'}</span>
        {svc.role && <span className="chip role">{svc.role}</span>}
      </div>

      {/* Details */}
      <div className="pod-details">
        {svc.desc && <Row label="Stack"  value={svc.desc} />}
        <Row label="Image"  value={container.image.split('/').pop()} mono />
        <Row label="Status" value={container.status} />
        {container.ports.length > 0 && <Row label="Ports" value={container.ports.join(', ')} />}
        {isK8s ? (
          <>
            <Row label="Pod"      value={container.name} mono small />
            <Row
              label="Restarts"
              value={container.restarts === 0 ? '0' : `${container.restarts}  — check logs`}
              warn={container.restarts > 0}
            />
          </>
        ) : (
          <Row label="ID" value={container.id} mono />
        )}
      </div>

      {/* CPU / memory bars (Docker only) */}
      {container.stats && (
        <div className="metric-bars">
          <MetricBar label="CPU" pct={parseFloat(container.stats.cpu)}    display={`${container.stats.cpu}%`} />
          <MetricBar label="MEM" pct={parseFloat(container.stats.memPercent)} display={`${container.stats.memMB} MB`} />
        </div>
      )}

      {/* Action buttons */}
      <div className="pod-actions">
        <button
          className={`act-btn restart-btn${restarting ? ' busy' : ''}`}
          onClick={onRestart}
          disabled={restarting}
          title="Rolling restart — pods come back automatically"
        >
          <span className={restarting ? 'spin' : ''}>&#8635;</span>
          {restarting ? 'Restarting…' : 'Restart'}
        </button>
        <button
          className="act-btn logs-btn"
          onClick={onLogs}
          title="View the last 100 log lines from this service"
        >
          &#9776; Logs
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono, small, warn }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-val${mono ? ' mono' : ''}${small ? ' small' : ''}${warn ? ' warn' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function MetricBar({ label, pct, display }) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <div className="metric-track">
        <div className="metric-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="metric-num">{display}</span>
    </div>
  );
}

// ── Logs modal ─────────────────────────────────────────────────────────────────
function LogsModal({ name, logs, loading, onClose }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView();
  }, [logs, loading]);

  const lineClass = (line) => {
    if (/error|exception|fatal|panic/i.test(line)) return 'log-err';
    if (/warn|warning/i.test(line))                return 'log-warn';
    if (/info|started|listening|ready|success/i.test(line)) return 'log-info';
    return '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-title-label">Logs</span>
            <span className="modal-title-name">{name}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&#10005;</button>
        </div>

        <div className="modal-help">
          <span className="help-dot log-err-dot" /> error &nbsp;
          <span className="help-dot log-warn-dot" /> warning &nbsp;
          <span className="help-dot log-info-dot" /> info &nbsp;
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>· last 100 lines</span>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <span className="spinner" /> Loading logs…
            </div>
          ) : logs ? (
            <pre className="log-pre">
              {logs.split('\n').map((line, i) => (
                <div key={i} className={`log-line ${lineClass(line)}`}>{line || ' '}</div>
              ))}
              <div ref={bottomRef} />
            </pre>
          ) : (
            <div className="modal-empty">No logs available.</div>
          )}
        </div>

        <div className="modal-footer">
          {name} · Showing last 100 lines · Click outside to close
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [containers, setContainers]   = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [restarting, setRestarting]   = useState(null);
  const [toast, setToast]             = useState(null);
  const [modal, setModal]             = useState({ open: false, name: '', logs: '', loading: false });

  const fetchContainers = async () => {
    try {
      const res  = await fetch('/api/containers');
      const data = await res.json();
      setContainers(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchContainers();
    const id = setInterval(fetchContainers, 5000);
    return () => clearInterval(id);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestart = async (container) => {
    const name = getDeployName(container);
    setRestarting(container.name);
    try {
      const res  = await fetch(`/api/containers/${name}/restart`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        showToast(`${name} is restarting…`);
        setTimeout(fetchContainers, 2000);
      } else {
        showToast(data.error || 'Restart failed', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setTimeout(() => setRestarting(null), 3000);
    }
  };

  const handleLogs = async (container) => {
    const name = getDeployName(container);
    setModal({ open: true, name, logs: '', loading: true });
    try {
      const res  = await fetch(`/api/containers/${name}/logs`);
      const data = await res.json();
      setModal((m) => ({ ...m, logs: data.logs || 'No logs.', loading: false }));
    } catch (err) {
      setModal((m) => ({ ...m, logs: 'Error: ' + err.message, loading: false }));
    }
  };

  const closeModal = () => setModal({ open: false, name: '', logs: '', loading: false });

  const runtime      = containers[0]?.runtime;
  const isK8s        = runtime === 'kubernetes';
  const runtimeLabel = isK8s ? 'Kubernetes' : runtime === 'docker' ? 'Docker' : null;
  const running      = containers.filter((c) => c.state === 'running').length;
  const stopped      = containers.length - running;
  const restarts     = isK8s ? containers.reduce((s, c) => s + (c.restarts || 0), 0) : null;

  return (
    <div className="dashboard">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {modal.open && <LogsModal {...modal} onClose={closeModal} />}

      {/* Stats bar */}
      <div className="stats-row">
        <StatCard label="Total"    value={containers.length} color="rgba(255,255,255,0.6)" />
        <StatCard label="Running"  value={running}           color="#34d399" />
        <StatCard label="Stopped"  value={stopped}           color={stopped  > 0 ? '#f87171' : 'rgba(255,255,255,0.25)'} />
        {restarts !== null && (
          <StatCard label="Restarts" value={restarts} color={restarts > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)'} />
        )}
      </div>

      {/* Architecture diagram */}
      <div className="diagram-card">
        <div className="diagram-top">
          <h2>Architecture</h2>
          <div className="diagram-meta">
            {runtimeLabel && (
              <span className={`chip runtime ${isK8s ? 'k8s' : 'docker'}`} style={{ fontSize: '0.78rem', padding: '3px 10px' }}>
                {runtimeLabel}
              </span>
            )}
            <div className="refresh-status">
              <span className="refresh-pulse" />
              {lastUpdated && <span>Updated {lastUpdated}</span>}
            </div>
          </div>
        </div>
        <ArchDiagram containers={containers} runtime={runtime} />
      </div>

      {/* Pods / containers */}
      <div className="section-head">
        <h2>Pods &amp; Containers</h2>
        <span className="section-hint">Restart a service or view its logs directly from here</span>
      </div>

      <div className="pods-grid">
        {containers.length === 0 ? (
          <div className="empty-state">Waiting for container data…</div>
        ) : (
          containers.map((c) => (
            <PodCard
              key={c.id}
              container={c}
              onRestart={() => handleRestart(c)}
              onLogs={() => handleLogs(c)}
              restarting={restarting === c.name}
            />
          ))
        )}
      </div>
    </div>
  );
}
