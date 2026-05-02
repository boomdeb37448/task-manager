const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const https = require('https');
const fs = require('fs');

const isK8s = fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');

// ── Docker mode ────────────────────────────────────────────────────────────────

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function getDockerStats(containerId) {
  return new Promise((resolve) => {
    const c = docker.getContainer(containerId);
    c.stats({ stream: false }, (err, data) => {
      if (err || !data) return resolve(null);
      const cpuDelta = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage;
      const systemDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage;
      const numCpus = data.cpu_stats.online_cpus || 1;
      const cpu = systemDelta > 0 ? ((cpuDelta / systemDelta) * numCpus * 100).toFixed(1) : '0.0';
      const memUsage = data.memory_stats.usage || 0;
      const memLimit = data.memory_stats.limit || 1;
      resolve({
        cpu,
        memMB: (memUsage / (1024 * 1024)).toFixed(1),
        memPercent: ((memUsage / memLimit) * 100).toFixed(1),
      });
    });
  });
}

async function getDockerContainers() {
  const list = await docker.listContainers({ all: true });
  return Promise.all(
    list.map(async (c) => {
      const stats = c.State === 'running' ? await getDockerStats(c.Id) : null;
      return {
        id: c.Id.substring(0, 12),
        name: c.Names[0].replace('/', ''),
        image: c.Image,
        status: c.Status,
        state: c.State,
        ports: c.Ports.map((p) => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : `${p.PrivatePort}`),
        restarts: 0,
        runtime: 'docker',
        stats,
      };
    })
  );
}

// ── Kubernetes mode ────────────────────────────────────────────────────────────

function k8sRequest(path) {
  const token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
  const ca    = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: process.env.KUBERNETES_SERVICE_HOST,
      port:     parseInt(process.env.KUBERNETES_SERVICE_PORT),
      path,
      method:   'GET',
      headers:  { Authorization: `Bearer ${token}` },
      ca,
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getK8sPods() {
  const namespace = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf8');
  const data = await k8sRequest(`/api/v1/namespaces/${namespace}/pods`);

  return data.items.map((pod) => {
    const cs       = pod.status.containerStatuses?.[0];
    const phase    = pod.status.phase || 'Unknown';
    const state    = phase.toLowerCase() === 'running' ? 'running' : phase.toLowerCase();
    const image    = pod.spec.containers[0]?.image || '';
    const ports    = pod.spec.containers[0]?.ports?.map((p) => `${p.containerPort}`) || [];
    const restarts = cs?.restartCount || 0;
    const startedAt = cs?.state?.running?.startedAt;

    const uptime = startedAt
      ? `Up ${Math.floor((Date.now() - new Date(startedAt)) / 60000)} min`
      : phase;

    return {
      id:       pod.metadata.uid.substring(0, 12),
      name:     pod.metadata.name,
      image,
      status:   uptime,
      state,
      ports,
      restarts,
      runtime:  'kubernetes',
      stats:    null,
    };
  });
}

// ── Route ──────────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const containers = isK8s ? await getK8sPods() : await getDockerContainers();
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
