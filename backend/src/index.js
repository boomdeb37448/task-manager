const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/tasks');
const containerRoutes = require('./routes/containers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/containers', containerRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
