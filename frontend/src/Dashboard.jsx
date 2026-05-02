import { useState, useEffect } from 'react';
import './Dashboard.css';

const SERVICE_MAP = {
  frontend: { color: '#60a5fa', port: '3000' },
  backend:  { color: '#a78bfa', port: '5000' },
  postgres: { color: '#34d399', port: '5432' },
  redis:    { color: '#f59e0b', port: '6379' },
};

function getServiceKey(name) {
  if (name.includes('frontend')) return 'frontend';
  if (name.includes('backend'))  return 'backend';
  if (name.includes('postgres')) return 'postgres';
  if (name.includes('redis'))    return 'redis';
  return null;
}

function ArchDiagram({ containers, runtime }) {
  const stateOf = (key) => {
    const c = containers.find((c) => getServiceKey(c.name) === key);
    return c?.state === 'running';
  };
  const dot    = (r) => r ? '#34d399' : '#f87171';
  const shadow = (r) => r ? 'drop-shadow(0 0 8px #34d399)' : 'none';

  if (runtime === 'kubernetes') return <K8sDiagram stateOf={stateOf} dot={dot} shadow={shadow} />;
  return <DockerDiagram stateOf={stateOf} dot={dot} shadow={shadow} />;
}

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
    </defs>
  );
}

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

function K8sDiagram({ stateOf, dot, shadow }) {
  const SvcBadge = ({ x, y, label, color }) => (
    <>
      <rect x={x} y={y} width="78" height="16" rx="4" fill={`${color}22`} stroke={color} strokeWidth="0.8" strokeOpacity="0.5" />
      <text x={x + 39} y={y + 11} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={color}>{label}</text>
    </>
  );

  return (
    <svg className="diagram-svg" viewBox="0 0 520 390" fill="none">
      <Defs />

      {/* Browser */}
      <rect x="195" y="8" width="130" height="36" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="260" y="30" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">Browser / Client</text>

      {/* Arrow + NodePort label */}
      <line x1="260" y1="44" x2="260" y2="66" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="210" y="47" width="100" height="16" rx="4" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="0.8" />
      <text x="260" y="58" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#a78bfa">NodePort :8080</text>

      {/* Namespace boundary */}
      <rect x="8" y="70" width="504" height="308" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="8 4" />
      <text x="22" y="87" fontSize="9.5" fontWeight="700" fill="rgba(255,255,255,0.35)" letterSpacing="1">NAMESPACE: task-manager</text>

      {/* Frontend pod  y=92 → bottom=164 */}
      <rect x="160" y="92" width="200" height="72" rx="14" fill="url(#gFront)" stroke="#60a5fa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="184" cy="111" r="6" fill={dot(stateOf('frontend'))} style={{ filter: shadow(stateOf('frontend')) }} />
      <text x="200" y="116" className="node-label" fontSize="13" fill="#fff">Frontend Pod</text>
      <text x="184" y="132" className="node-sublabel" fontSize="10" fill="rgba(255,255,255,0.45)">React + Nginx  ·  Port 80</text>
      <text x="184" y="150" className="node-sublabel" fontSize="9.5" fill="#60a5fa">svc: frontend  (NodePort)</text>
      <SvcBadge x={282} y={95} label="NodePort :80" color="#60a5fa" />

      {/* Arrow Frontend → Backend */}
      <line x1="260" y1="164" x2="260" y2="200" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />

      {/* Backend pod  y=200 → bottom=272 */}
      <rect x="160" y="200" width="200" height="72" rx="14" fill="url(#gBack)" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="184" cy="219" r="6" fill={dot(stateOf('backend'))} style={{ filter: shadow(stateOf('backend')) }} />
      <text x="200" y="224" className="node-label" fontSize="13" fill="#fff">Backend Pod</text>
      <text x="184" y="240" className="node-sublabel" fontSize="10" fill="rgba(255,255,255,0.45)">Node.js + Express  ·  Port 5000</text>
      <text x="184" y="258" className="node-sublabel" fontSize="9.5" fill="#a78bfa">svc: backend  (ClusterIP)</text>
      <SvcBadge x={282} y={203} label="ClusterIP :5000" color="#a78bfa" />

      {/* Arrows Backend → PG and Redis */}
      <line x1="210" y1="272" x2="118" y2="308" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <line x1="310" y1="272" x2="402" y2="308" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />

      {/* Postgres pod  y=308 → bottom=362 */}
      <rect x="22" y="308" width="190" height="58" rx="14" fill="url(#gPg)" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="46" cy="325" r="6" fill={dot(stateOf('postgres'))} style={{ filter: shadow(stateOf('postgres')) }} />
      <text x="62" y="330" className="node-label" fontSize="13" fill="#fff">PostgreSQL Pod</text>
      <text x="46" y="346" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">postgres:16  ·  Port 5432</text>
      <text x="46" y="360" className="node-sublabel" fontSize="9" fill="#34d399">svc: postgres  (ClusterIP)</text>

      {/* Redis pod  y=308 → bottom=362 */}
      <rect x="308" y="308" width="190" height="58" rx="14" fill="url(#gRedis)" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="332" cy="325" r="6" fill={dot(stateOf('redis'))} style={{ filter: shadow(stateOf('redis')) }} />
      <text x="348" y="330" className="node-label" fontSize="13" fill="#fff">Redis Pod</text>
      <text x="332" y="346" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">redis:7  ·  Port 6379</text>
      <text x="332" y="360" className="node-sublabel" fontSize="9" fill="#f59e0b">svc: redis  (ClusterIP)</text>
    </svg>
  );
}

function ContainerCard({ container }) {
  const key = getServiceKey(container.name);
  const accent = SERVICE_MAP[key]?.color || '#a78bfa';
  const isRunning = container.state === 'running';
  const stateClass = isRunning ? 'running' : container.state;
  const isK8s = container.runtime === 'kubernetes';

  return (
    <div className="container-card" style={{ borderColor: isRunning ? `${accent}30` : undefined }}>
      <div className="card-top">
        <span className="card-name" style={{ color: accent }}>
          {isK8s ? container.name.split('-')[0] : container.name}
        </span>
        <span className={`state-badge ${stateClass}`}>
          <span className="state-dot" />
          {container.state}
        </span>
      </div>

      <div className="runtime-row">
        <span className={`runtime-badge ${isK8s ? 'k8s' : 'docker'}`}>
          {isK8s ? 'K8s Pod' : 'Docker'}
        </span>
        {isK8s && (
          <span className="pod-name">{container.name}</span>
        )}
      </div>

      <div className="card-detail">
        <span className="detail-label">Image</span>
        <span className="detail-value">{container.image}</span>
      </div>
      <div className="card-detail">
        <span className="detail-label">Status</span>
        <span className="detail-value">{container.status}</span>
      </div>
      {container.ports.length > 0 && (
        <div className="card-detail">
          <span className="detail-label">Ports</span>
          <span className="detail-value">{container.ports.join(', ')}</span>
        </div>
      )}
      <div className="card-detail">
        <span className="detail-label">{isK8s ? 'Restarts' : 'ID'}</span>
        <span className="detail-value" style={!isK8s ? { fontFamily: 'monospace', fontSize: '0.78rem' } : {}}>
          {isK8s ? container.restarts : container.id}
        </span>
      </div>

      {container.stats && (
        <div className="metric-bar-wrap">
          <div className="metric-row">
            <span className="metric-label">CPU</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: `${Math.min(container.stats.cpu, 100)}%` }} />
            </div>
            <span className="metric-value">{container.stats.cpu}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">MEM</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: `${Math.min(container.stats.memPercent, 100)}%` }} />
            </div>
            <span className="metric-value">{container.stats.memMB} MB</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [containers, setContainers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/containers');
      const data = await res.json();
      setContainers(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch containers', err);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const runtime = containers[0]?.runtime;
  const runtimeLabel = runtime === 'kubernetes' ? 'Kubernetes' : runtime === 'docker' ? 'Docker' : null;

  return (
    <div className="dashboard">
      <div className="diagram-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>Architecture</h2>
          {runtimeLabel && (
            <span className={`runtime-badge ${runtime === 'kubernetes' ? 'k8s' : 'docker'}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              {runtimeLabel}
            </span>
          )}
        </div>
        <ArchDiagram containers={containers} runtime={runtime} />
      </div>

      <div className="refresh-bar">
        <span className="refresh-dot" />
        Auto-refresh every 5s
        {lastUpdated && <span>· Updated {lastUpdated}</span>}
      </div>

      <div className="cards-grid">
        {containers.map((c) => (
          <ContainerCard key={c.id} container={c} />
        ))}
      </div>
    </div>
  );
}
