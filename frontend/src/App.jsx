import './App.css';
import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from './api';
import Column from './components/Column';
import TaskForm from './components/TaskFrom';
import { STATUSES } from './statuses';
import { DragDropContext} from '@hello-pangea/dnd';

function App()
{
  const [tasks, setTasks] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {getTasks().then((data) => {setTasks(data)}).catch((err) => {setError(err.message)});
  }, []);

  const handleCreate = async (data) => {
    const created = await createTask(data);
    setTasks((prev) => [...prev, created]);
    setIsModalOpen(false);
  };

  // Optimistic: move the card on screen first, then save. If the save fails, put it back.
  const handleStatusChange = async (id, status) => {
    const previous = tasks.find((t) => t.id === id);
    if (!previous || previous.status === status) return;

    setError(null);
    setTasks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));

    try{
      const updated = await updateTask(id, { status })
      setTasks((prev) => prev.map((b) => (b.id === id? updated : b)));
    }
    catch(err){
      // Only undo if the card still has the status we set (it wasn't moved again meanwhile)
      setTasks((prev) => prev.map((b) => (b.id === id && b.status === status ? { ...b, status: previous.status } : b)));
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

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return; // dropped outside a column, or Esc pressed
    if (destination.droppableId === source.droppableId) return; // reordering comes later

    handleStatusChange(Number(draggableId), destination.droppableId);
  }

  return(
    <main className="container">
      <header className="header">
        <h1 className='header-title'>
          Task Board
        </h1>
        <button className="add-task-btn" onClick={() => setIsModalOpen(true)}>
          + Add Task
        </button>
      </header>

      {error && <p className="error-message">{error}</p>}

      {/* <TaskForm onCreate={handleCreate} /> */}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Add New Task</h2>
              <button 
                className="close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </header>
            
            <TaskForm onCreate={handleCreate} />
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
        {STATUSES.map((s) => (
          <Column 
          key={s.value}
          title={s.label}
          tasks={tasks.filter((t) => t.status === s.value)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onEdit={handleEdit}
          status={s.value}
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
      </DragDropContext>
      
    </main>
  );
}
export default App;
