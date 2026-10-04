import TaskCard from './TaskCard.jsx';

function Column({title, tasks, onStatusChange, onDelete, onEdit})
{
    return(
        <section className="column">
            <h2>
                {title}
            </h2>
            
            {tasks.length === 0 ? (
                <p className="empty-message">No tasks</p>
            ) : (
                tasks.map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} onEdit={onEdit}/>
                ))
            )}
        </section>
    );
}

export default Column;