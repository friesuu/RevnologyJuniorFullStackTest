import TaskCard from './TaskCard.jsx';
import { Droppable } from '@hello-pangea/dnd';

function Column({status, title, tasks, onStatusChange, onDelete, onEdit})
{
    return(
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <section 
                className={snapshot.isDraggingOver ? 'column drag-over' : 'column'}
                ref={provided.innerRef}
                {...provided.droppableProps}>
                    <h2>
                        {title}
                    </h2>
                    
                    {tasks.length === 0 ? (
                        <p className="empty-message">No tasks</p>
                    ) : (
                        tasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} onStatusChange={onStatusChange} onDelete={onDelete} onEdit={onEdit}/>
                        ))
                    )}

                    {provided.placeholder}
                </section>
            )}
        </Droppable>
    );
}

export default Column;