const API_URL = 'http://localhost:3000';

export async function getTasks()
{
    const response = await fetch(`${API_URL}/tasks`);
    if(response.ok)
    {
        return response.json();
    }
    else{
        throw new Error(`Failed to fetch tasks (${response.status} ${response.statusText})`)
    }
}
