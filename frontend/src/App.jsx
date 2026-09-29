import './App.css';
import { useState, useEffect } from 'react';
import { getTasks } from './api';
import Column from './components/Column';

function App()
{
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() =>{
    getTasks().then((data) => setTasks(data)).catch((err) => setError(err.message))
  }, []);

  return(
    <main>
      <h1>
        Task Board
      </h1>

      {error && <p className="error-message">{error}</p>}

      <div className="board">
        <Column 
        title="To do" 
        tasks={tasks.filter((t) => t.status === 'todo')}
        />
        <Column 
        title="In Progress" 
        tasks={tasks.filter((t) => t.status === 'in_progress')}
        />
        <Column 
        title="Done" 
        tasks={tasks.filter((t) => t.status === 'done')}
        />
      </div>
    </main>
  );
}

export default App;
