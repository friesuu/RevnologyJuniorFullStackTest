import { STATUSES } from "../statuses";

function TaskCard({ task, onStatusChange})
{
    return(
        <div className="task-card">
            <h3>
                {task.title}
            </h3>

            {task.description && <p>{task.description}</p>}
            {task.dueDate && <p>Due: {task.dueDate}</p>}

            <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}>
                {STATUSES.map((c) => (
                    <option key={c.value} value={c.value}>
                        {c.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default TaskCard;