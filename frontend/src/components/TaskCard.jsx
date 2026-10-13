import { STATUSES } from "../statuses";
import { useState } from "react";
import TaskEditForm from "./TaskEditForm";
import TrashIcon from "./TrashIcon";
import { isOverdue } from "../dates";
import { Draggable } from "@hello-pangea/dnd";

function TaskCard({ index, task, onStatusChange, onDelete, onEdit})
{
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = async (changes) => {
        await onEdit(task.id, changes)

        setIsEditing(false);
    }

    let className = 'task-card';
    if (isOverdue(task)) className += ' overdue';

    return(
        <Draggable draggableId={String(task.id)} index={index} isDragDisabled={isEditing}>
            {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={snapshot.isDragging ? `${className} dragging` : className}>
                {isEditing ? (
                     <TaskEditForm task={task} onSave={handleSave} onCancel={() => setIsEditing(false)} />
                ) : (
                    <div>
                        <h3>
                            {task.title}
                        </h3>

                        {task.description && <p>{task.description}</p>}
                        {task.dueDate && <p>Due: {task.dueDate} : </p>}
                        {isOverdue(task) && <span className="overdue-label">Overdue</span>}

                        <div className="task-actions">
                            <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}>
                                {STATUSES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>

                            <button className="edit-button" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>

                            {/* Icon only, so aria-label gives screen readers a name; title shows on hover */}
                            <button
                                className="delete-button"
                                aria-label={`Delete "${task.title}"`}
                                title="Delete"
                                onClick={() => {
                                    if(window.confirm(`Delete "${task.title}"?`)){
                                        onDelete(task.id)
                                    }
                                }}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}

        </Draggable>
    );
}

export default TaskCard;