import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './Dashboard';

const API = '/api/tasks';

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,6 4.5,9 10.5,3" />
    </svg>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setTasks(data);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask }),
    });
    setNewTask('');
    fetchTasks();
  };

  const toggleTask = async (id) => {
    await fetch(`${API}/${id}`, { method: 'PATCH' });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const doneCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - doneCount;
  const [page, setPage] = useState('tasks');

  return (
    <div className="app">
      <div className="header">
        <h1>Task Manager</h1>
        <p>Stay focused. Get things done. — Deployed by CI/CD</p>
      </div>

      <nav className="nav">
        <button className={`nav-btn ${page === 'tasks' ? 'active' : ''}`} onClick={() => setPage('tasks')}>
          Tasks
        </button>
        <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
          Dashboard
        </button>
      </nav>

      {page === 'dashboard' && <Dashboard />}

      {page === 'tasks' && <div className="card">
        <form className="form" onSubmit={addTask}>
          <input
            className="input"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
          />
          <button className="btn-add" type="submit">+ Add</button>
        </form>

        {tasks.length > 0 && (
          <div className="stats">
            <span className="stat-badge total">{tasks.length} Total</span>
            <span className="stat-badge done">{doneCount} Done</span>
            <span className="stat-badge pending">{pendingCount} Pending</span>
          </div>
        )}

        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✓</div>
              <p>No tasks yet. Add one above!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="checkmark">
                    <CheckIcon />
                  </span>
                </label>
                <span className="task-title">{task.title}</span>
                <button className="btn-delete" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>}
    </div>
  );
}

export default App;
