import './App.css';
import { useState, useEffect } from 'react';
import { getTasks, createTask } from './api';
import Column from './components/Column';
import TaskForm from './components/TaskFrom';
// import { createTask } from './api';

function App()
{
  const [tasks, setTasks] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {getTasks().then((data) => {setTasks(data)}).catch((err) => {setError(err.message)});
  }, []);

  const handleCreate = async (data) => {
    const created = await createTask(data);
    setTasks((prev) => [...prev, created]);
  };

  return(
    <main className="main">
      <h1>
        Task Board
      </h1>

      <TaskForm onCreate={handleCreate} />

      {error && <p className="error-message">{error}</p>}

      <div className="board">
        <Column 
        title="To do" 
        status="todo"
        tasks={tasks.filter((t) => t.status === 'todo')}
        />
        <Column 
        title="In Progress" 
        status="in_progress"
        tasks={tasks.filter((t) => t.status === 'in_progress')}
        />
        <Column 
        title="Done" 
        status="done"
        tasks={tasks.filter((t) => t.status === 'done')}
        />
      </div>
    </main>
  );
}

export default App;
