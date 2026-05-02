const express = require('express');
const router = express.Router();
const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function getStats(containerId) {
  return new Promise((resolve) => {
    const c = docker.getContainer(containerId);
    c.stats({ stream: false }, (err, data) => {
      if (err || !data) return resolve(null);

      const cpuDelta =
        data.cpu_stats.cpu_usage.total_usage -
        data.precpu_stats.cpu_usage.total_usage;
      const systemDelta =
        data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage;
      const numCpus = data.cpu_stats.online_cpus || 1;
      const cpu =
        systemDelta > 0
          ? ((cpuDelta / systemDelta) * numCpus * 100).toFixed(1)
          : '0.0';

      const memUsage = data.memory_stats.usage || 0;
      const memLimit = data.memory_stats.limit || 1;
      const memMB = (memUsage / (1024 * 1024)).toFixed(1);
      const memPercent = ((memUsage / memLimit) * 100).toFixed(1);

      resolve({ cpu, memMB, memPercent });
    });
  });
}

router.get('/', async (req, res) => {
  try {
    const list = await docker.listContainers({ all: true });

    const containers = await Promise.all(
      list.map(async (c) => {
        const stats = c.State === 'running' ? await getStats(c.Id) : null;
        return {
          id: c.Id.substring(0, 12),
          name: c.Names[0].replace('/', ''),
          image: c.Image,
          status: c.Status,
          state: c.State,
          ports: c.Ports.map((p) =>
            p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : `${p.PrivatePort}`
          ),
          created: c.Created,
          stats,
        };
      })
    );

    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
