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
  return (
    <svg className="diagram-svg" viewBox="0 0 520 430" fill="none">
      <Defs />

      {/* Browser */}
      <rect x="195" y="8" width="130" height="36" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="260" y="30" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">Browser / Client</text>

      {/* Arrow: browser → frontend (long gap, badge sits in upper half) */}
      <line x1="260" y1="44" x2="260" y2="92" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <rect x="210" y="50" width="100" height="16" rx="4" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="0.8" />
      <text x="260" y="61" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#a78bfa">NodePort :8080</text>

      {/* Namespace boundary */}
      <rect x="8" y="70" width="504" height="348" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="8 4" />
      <text x="22" y="86" fontSize="9.5" fontWeight="700" fill="rgba(255,255,255,0.35)" letterSpacing="1">NAMESPACE: task-manager</text>

      {/* Frontend pod  y=92 h=88 → bottom=180 */}
      <rect x="160" y="92" width="200" height="88" rx="14" fill="url(#gFront)" stroke="#60a5fa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="184" cy="112" r="6" fill={dot(stateOf('frontend'))} style={{ filter: shadow(stateOf('frontend')) }} />
      <text x="200" y="117" className="node-label" fontSize="13" fill="#fff">Frontend Pod</text>
      <text x="184" y="134" className="node-sublabel" fontSize="10" fill="rgba(255,255,255,0.45)">React + Nginx  ·  Port 80</text>
      <text x="184" y="151" className="node-sublabel" fontSize="9.5" fill="#60a5fa">svc: frontend  (NodePort)</text>
      <text x="184" y="167" className="node-sublabel" fontSize="9" fill="rgba(255,255,255,0.2)">task-manager-frontend</text>

      {/* Arrow Frontend → Backend  gap=32px */}
      <line x1="260" y1="180" x2="260" y2="212" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />

      {/* Backend pod  y=212 h=88 → bottom=300 */}
      <rect x="160" y="212" width="200" height="88" rx="14" fill="url(#gBack)" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="184" cy="232" r="6" fill={dot(stateOf('backend'))} style={{ filter: shadow(stateOf('backend')) }} />
      <text x="200" y="237" className="node-label" fontSize="13" fill="#fff">Backend Pod</text>
      <text x="184" y="254" className="node-sublabel" fontSize="10" fill="rgba(255,255,255,0.45)">Node.js + Express  ·  Port 5000</text>
      <text x="184" y="271" className="node-sublabel" fontSize="9.5" fill="#a78bfa">svc: backend  (ClusterIP)</text>
      <text x="184" y="287" className="node-sublabel" fontSize="9" fill="rgba(255,255,255,0.2)">task-manager-backend</text>

      {/* HPA indicator — right of Backend pod */}
      <line x1="360" y1="256" x2="374" y2="256" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 2" />
      <rect x="374" y="228" width="118" height="56" rx="8" fill="rgba(167,139,250,0.08)" stroke="#a78bfa" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="433" y="244" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a78bfa">HPA</text>
      <text x="433" y="258" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.45)">min: 1  ·  max: 3</text>
      <text x="433" y="272" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">target CPU: 50%</text>

      {/* Arrows Backend → PG and Redis  gap=34px */}
      <line x1="210" y1="300" x2="117" y2="334" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <line x1="310" y1="300" x2="403" y2="334" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />

      {/* Postgres pod  y=334 h=72 → bottom=406 */}
      <rect x="22" y="334" width="190" height="72" rx="14" fill="url(#gPg)" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="46" cy="353" r="6" fill={dot(stateOf('postgres'))} style={{ filter: shadow(stateOf('postgres')) }} />
      <text x="62" y="358" className="node-label" fontSize="13" fill="#fff">PostgreSQL Pod</text>
      <text x="46" y="374" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">postgres:16  ·  Port 5432</text>
      <text x="46" y="389" className="node-sublabel" fontSize="9" fill="#34d399">svc: postgres  (ClusterIP)</text>

      {/* Redis pod  y=334 h=72 → bottom=406 */}
      <rect x="308" y="334" width="190" height="72" rx="14" fill="url(#gRedis)" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="332" cy="353" r="6" fill={dot(stateOf('redis'))} style={{ filter: shadow(stateOf('redis')) }} />
      <text x="348" y="358" className="node-label" fontSize="13" fill="#fff">Redis Pod</text>
      <text x="332" y="374" className="node-sublabel" fontSize="9.5" fill="rgba(255,255,255,0.45)">redis:7  ·  Port 6379</text>
      <text x="332" y="389" className="node-sublabel" fontSize="9" fill="#f59e0b">svc: redis  (ClusterIP)</text>
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
