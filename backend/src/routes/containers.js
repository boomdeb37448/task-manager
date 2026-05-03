const express = require('express');
const router  = express.Router();
const Docker  = require('dockerode');
const https   = require('https');
const fs      = require('fs');

const isK8s = fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// ── Docker helpers ─────────────────────────────────────────────────────────────

function parseDockerLogs(buffer) {
  if (!Buffer.isBuffer(buffer)) return String(buffer);
  const lines = [];
  let i = 0;
  while (i + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(i + 4);
    i += 8;
    if (i + size > buffer.length) break;
    lines.push(buffer.slice(i, i + size).toString('utf8'));
    i += size;
  }
  return lines.join('') || buffer.toString('utf8');
}

async function getDockerStats(containerId) {
  return new Promise((resolve) => {
    const c = docker.getContainer(containerId);
    c.stats({ stream: false }, (err, data) => {
      if (err || !data) return resolve(null);
      const cpuDelta    = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage;
      const systemDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage;
      const numCpus     = data.cpu_stats.online_cpus || 1;
      const cpu         = systemDelta > 0 ? ((cpuDelta / systemDelta) * numCpus * 100).toFixed(1) : '0.0';
      const memUsage    = data.memory_stats.usage || 0;
      const memLimit    = data.memory_stats.limit || 1;
      resolve({
        cpu,
        memMB:      (memUsage / (1024 * 1024)).toFixed(1),
        memPercent: ((memUsage / memLimit) * 100).toFixed(1),
      });
    });
  });
}

async function getDockerContainers() {
  const list = await docker.listContainers({ all: true });
  return Promise.all(list.map(async (c) => {
    const stats = c.State === 'running' ? await getDockerStats(c.Id) : null;
    return {
      id:      c.Id.substring(0, 12),
      name:    c.Names[0].replace('/', ''),
      image:   c.Image,
      status:  c.Status,
      state:   c.State,
      ports:   c.Ports.map((p) => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : `${p.PrivatePort}`),
      restarts: 0,
      runtime: 'docker',
      stats,
    };
  }));
}

// ── Kubernetes helpers ─────────────────────────────────────────────────────────

function k8sRequest(path, raw = false) {
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
        if (raw) return resolve(body);
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function k8sPatch(path, body) {
  const token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
  const ca    = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt');
  const data  = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: process.env.KUBERNETES_SERVICE_HOST,
      port:     parseInt(process.env.KUBERNETES_SERVICE_PORT),
      path,
      method:   'PATCH',
      headers:  {
        Authorization:   `Bearer ${token}`,
        'Content-Type':  'application/strategic-merge-patch+json',
        'Content-Length': Buffer.byteLength(data),
      },
      ca,
    }, (res) => {
      let resp = '';
      res.on('data', (c) => (resp += c));
      res.on('end', () => resolve(resp));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getNamespace() {
  return fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf8');
}

async function getK8sPods() {
  const namespace = getNamespace();
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
      id:      pod.metadata.uid.substring(0, 12),
      name:    pod.metadata.name,
      image,
      status:  uptime,
      state,
      ports,
      restarts,
      runtime: 'kubernetes',
      stats:   null,
    };
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const containers = isK8s ? await getK8sPods() : await getDockerContainers();
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:name/restart', async (req, res) => {
  const name = req.params.name;
  try {
    if (isK8s) {
      const namespace = getNamespace();
      await k8sPatch(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`, {
        spec: {
          template: {
            metadata: {
              annotations: { 'kubectl.kubernetes.io/restartedAt': new Date().toISOString() },
            },
          },
        },
      });
    } else {
      await new Promise((resolve, reject) => {
        docker.getContainer(name).restart((err) => (err ? reject(err) : resolve()));
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:name/logs', async (req, res) => {
  const name = req.params.name;
  try {
    let logs = '';
    if (isK8s) {
      const namespace = getNamespace();
      const pods = await k8sRequest(`/api/v1/namespaces/${namespace}/pods?labelSelector=app=${name}`);
      const pod  = pods.items?.[0];
      if (!pod) return res.json({ logs: 'No pods found for this service.' });
      logs = await k8sRequest(
        `/api/v1/namespaces/${namespace}/pods/${pod.metadata.name}/log?tailLines=100&timestamps=true`,
        true
      );
    } else {
      const buf = await new Promise((resolve, reject) => {
        docker.getContainer(name).logs(
          { stdout: true, stderr: true, tail: 100, timestamps: true },
          (err, data) => (err ? reject(err) : resolve(data))
        );
      });
      logs = parseDockerLogs(buf);
    }
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
