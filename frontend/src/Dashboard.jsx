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

function ArchDiagram({ containers }) {
  const stateOf = (key) => {
    const c = containers.find((c) => getServiceKey(c.name) === key);
    return c?.state === 'running';
  };

  const dot = (running) =>
    running ? '#34d399' : '#f87171';

  const shadow = (running) =>
    running ? 'drop-shadow(0 0 8px #34d399)' : 'none';

  /*
   * Layout (y positions):
   *   Browser   : y=8,   h=36  → bottom=44
   *   Frontend  : y=64,  h=68  → bottom=132   (gap 20px, arrow visible)
   *   Backend   : y=172, h=68  → bottom=240   (gap 40px, arrow visible)
   *   PG/Redis  : y=278, h=54  → bottom=332   (gap 38px, arrows visible)
   */
  return (
    <svg className="diagram-svg" viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.3)" />
        </marker>
        <linearGradient id="gFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="gBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="gPg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="gRedis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Browser */}
      <rect x="195" y="8" width="130" height="36" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="260" y="30" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">Browser / Client</text>

      {/* Arrow: Browser → Frontend (bottom=44 → top=64) */}
      <line x1="260" y1="44" x2="260" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />

      {/* Frontend box  y=64 → bottom=132 */}
      <rect x="170" y="64" width="180" height="68" rx="14" fill="url(#gFront)" stroke="#60a5fa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="194" cy="81" r="6" fill={dot(stateOf('frontend'))} style={{ filter: shadow(stateOf('frontend')) }} />
      <text x="210" y="86" className="node-label" fontSize="13" fill="#fff">Frontend</text>
      <text x="194" y="102" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">React + Nginx  ·  Port 3000</text>
      <text x="194" y="122" className="node-sublabel" fontSize="10" fill="#60a5fa">task-manager-frontend</text>

      {/* Arrow: Frontend → Backend (bottom=132 → top=172) */}
      <line x1="260" y1="132" x2="260" y2="170" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />

      {/* Backend box  y=172 → bottom=240 */}
      <rect x="170" y="172" width="180" height="68" rx="14" fill="url(#gBack)" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="194" cy="189" r="6" fill={dot(stateOf('backend'))} style={{ filter: shadow(stateOf('backend')) }} />
      <text x="210" y="194" className="node-label" fontSize="13" fill="#fff">Backend</text>
      <text x="194" y="210" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">Node.js + Express  ·  Port 5000</text>
      <text x="194" y="230" className="node-sublabel" fontSize="10" fill="#a78bfa">task-manager-backend</text>

      {/* Arrow: Backend → Postgres (bottom-left=240 → top=278) */}
      <line x1="220" y1="240" x2="120" y2="276" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />

      {/* Arrow: Backend → Redis (bottom-right=240 → top=278) */}
      <line x1="300" y1="240" x2="400" y2="276" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />

      {/* Postgres box  y=278 → bottom=332 */}
      <rect x="30" y="278" width="180" height="54" rx="14" fill="url(#gPg)" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="54" cy="295" r="6" fill={dot(stateOf('postgres'))} style={{ filter: shadow(stateOf('postgres')) }} />
      <text x="70" y="300" className="node-label" fontSize="13" fill="#fff">PostgreSQL</text>
      <text x="54" y="317" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">postgres:16  ·  Port 5432</text>

      {/* Redis box  y=278 → bottom=332 */}
      <rect x="310" y="278" width="180" height="54" rx="14" fill="url(#gRedis)" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="334" cy="295" r="6" fill={dot(stateOf('redis'))} style={{ filter: shadow(stateOf('redis')) }} />
      <text x="350" y="300" className="node-label" fontSize="13" fill="#fff">Redis</text>
      <text x="334" y="317" className="node-sublabel" fontSize="10.5" fill="rgba(255,255,255,0.45)">redis:7  ·  Port 6379</text>
    </svg>
  );
}

function ContainerCard({ container }) {
  const key = getServiceKey(container.name);
  const accent = SERVICE_MAP[key]?.color || '#a78bfa';
  const isRunning = container.state === 'running';
  const stateClass = isRunning ? 'running' : container.state;

  const uptime = isRunning
    ? container.status
    : container.status;

  return (
    <div className="container-card" style={{ borderColor: isRunning ? `${accent}30` : undefined }}>
      <div className="card-top">
        <span className="card-name" style={{ color: accent }}>{container.name}</span>
        <span className={`state-badge ${stateClass}`}>
          <span className="state-dot" />
          {container.state}
        </span>
      </div>

      <div className="card-detail">
        <span className="detail-label">Image</span>
        <span className="detail-value">{container.image}</span>
      </div>
      <div className="card-detail">
        <span className="detail-label">Status</span>
        <span className="detail-value">{uptime}</span>
      </div>
      {container.ports.length > 0 && (
        <div className="card-detail">
          <span className="detail-label">Ports</span>
          <span className="detail-value">{container.ports.join(', ')}</span>
        </div>
      )}
      <div className="card-detail">
        <span className="detail-label">ID</span>
        <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{container.id}</span>
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

  return (
    <div className="dashboard">
      <div className="diagram-card">
        <h2>Architecture</h2>
        <ArchDiagram containers={containers} />
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
