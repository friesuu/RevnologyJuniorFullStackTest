import { STATUSES } from "../statuses";
import { useState } from "react";
import TaskEditForm from "./TaskEditForm";
import { isOverdue } from "../dates";

function TaskCard({ task, onStatusChange, onDelete, onEdit})
{
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = async (changes) => {
        await onEdit(task.id, changes)

        setIsEditing(false);
    }

    if(isEditing)
    {
        return(
            <div className="task-card">
                <TaskEditForm task={task} onSave={handleSave} onCancel={() => setIsEditing(false)} />
            </div>
        )
    }

    return(
        <div className={isOverdue(task) ? 'task-card overdue' : 'task-card'}>
            <h3>
                {task.title}
            </h3>

            {task.description && <p>{task.description}</p>}
            {task.dueDate && <p>Due: {task.dueDate} : </p>}
            {isOverdue(task) && <span className="overdue-label">Overdue</span>}

            <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}>
                {STATUSES.map((c) => (
                    <option key={c.value} value={c.value}>
                        {c.label}
                    </option>
                ))}
            </select>

            <button className="delete-button" onClick={() => {
                if(window.confirm(`Delete "${task.title}"?`)){
                    onDelete(task.id)
                }
            }}
            >
                Delete
            </button>

            <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit
            </button>
        </div>
    );
}

export default TaskCard;