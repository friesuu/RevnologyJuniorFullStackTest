import TaskCard from './TaskCard.jsx';

function Column({title, tasks, onStatusChange, onDelete})
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
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onDelete={onDelete}>
                    {/* <h3>{task.title}</h3> */}
                </TaskCard>
                ))
            )}
        </section>
    );
}

export default Column;