const express = require('express');
const cors = require('cors');
const pool = require('./db');
const taskRoutes = require('./routes/tasks');
const containerRoutes = require('./routes/containers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Liveness: is the process alive and not deadlocked?
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
});

// Readiness: is the service ready to handle requests? (checks DB)
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', db: err.message });
  }
});

app.use('/api/tasks', taskRoutes);
app.use('/api/containers', containerRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
