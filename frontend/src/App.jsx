import './App.css';
import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, moveTask, deleteTask } from './api';
import Column from './components/Column';
import TaskForm from './components/TaskFrom';
import { STATUSES } from './statuses';
import { moveInList } from './reorder';
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

  // Optimistic: move the card on screen first, then save. If the save fails, undo.
  const handleMove = async (id, status, index) => {
    const previous = tasks;

    setError(null);
    setTasks((prev) => moveInList(prev, id, status, index));

    try{
      const moved = await moveTask(id, status, index);
      setTasks((prev) => prev.map((b) => (b.id === id ? moved : b)));
    }
    catch(err){
      setError(err.message);
      try{
        setTasks(await getTasks()); // the server knows the real order
      }
      catch{
        setTasks(previous); // server unreachable: put the board back as it was
      }
    }
  };

  // The dropdown sends the task to the bottom of the chosen column
  const handleStatusChange = (id, status) => {
    const bottom = tasks.filter((t) => t.status === status && t.id !== id).length;
    handleMove(id, status, bottom);
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
    if (destination.droppableId === source.droppableId && destination.index === source.index) return; // dropped where it was

    handleMove(Number(draggableId), destination.droppableId, destination.index);
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
