CREATE TABLE IF NOT EXISTS tasks (
  id        SERIAL PRIMARY KEY,
  title     VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO tasks (title) VALUES
  ('Learn Docker basics'),
  ('Write a Dockerfile'),
  ('Set up docker-compose'),
  ('Deploy to Kubernetes');
