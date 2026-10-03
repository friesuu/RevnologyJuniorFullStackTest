const API_URL = 'http://localhost:3000/tasks';

export async function getTasks()
{
    // const response = await fetch(`${API_URL}/tasks`);
    const response = await fetch(API_URL);
    if(response.ok)
    {
        return response.json();
    }
    else{
        throw new Error(`Failed to fetch tasks (${response.status} ${response.statusText})`)
    }
}

export async function createTask(data)
{
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    
    if (!response.ok) {
    const errorData = await response.json();
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Failed to create task';

    throw new Error(message);
  }

    return response.json();
}

export async function updateTask(id, changes)
{
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
    });
    
    if (!response.ok) {
    const errorData = await response.json();
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Failed to update task';

    throw new Error(message);
  }

    return response.json();
}

export async function deleteTask(id)
{
    const response = await fetch(`${API_URL}/${id}`, {
    
        method: 'DELETE'
    });

    if(!response.ok)
    {
        const  errorData = await response.json();
        const message = Array.isArray(errorData.message) ? errorData.message.join(', '): errorData.message || 'Failed to delete task';

        throw new Error(message);
    }
}
