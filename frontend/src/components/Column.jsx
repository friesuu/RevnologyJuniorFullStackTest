function Column({title, tasks})
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
                <div key={task.id} className="task-card">
                    <h3>{task.title}</h3>
                </div>
                ))
            )}
        </section>
    );
}

export default Column;