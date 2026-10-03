import './App.css';
import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from './api';
import Column from './components/Column';
import TaskForm from './components/TaskFrom';
import { STATUSES } from './statuses';
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

  const handleStatusChange = async (id, status) => {
    try{
      const updated = await updateTask(id, { status })
      setTasks((prev) => prev.map((b) => (b.id === id? updated : b)));
    }
    catch(err){
      setError(err.message)
    }
  };

  const handleDelete = async (id) => {
    try{
      await deleteTask(id);
      setTasks((prev) => prev.filter((b) => b.id !== id));
    }
    catch(err){
      setError(err.message)
    }
  }

  const handleEdit = async (id, changes) => {
    const updated = await updateTask(id, changes);

    setTasks((prev) => prev.map((b) => (b.id === id? updated : b)));
  }

  return(
    <main className="main">
      <h1>
        Task Board
      </h1>

      <TaskForm onCreate={handleCreate} />

      {error && <p className="error-message">{error}</p>}

      <div className="board">
        {STATUSES.map((s) => (
          <Column 
          key={s.value}
          title={s.label}
          tasks={tasks.filter((t) => t.status === s.value)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onEdit={handleEdit}
          />
        ))}
        {/* <Column 
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
        /> */}
      </div>
    </main>
  );
}
export default App;
