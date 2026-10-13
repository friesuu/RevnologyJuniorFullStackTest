// Returns a new tasks array with one task moved to `index` inside the `status` column.
// Columns are just tasks.filter(by status), so the order inside a column is the order
// in this array. Same rule as the server: an index past the end means "at the bottom".
export function moveInList(tasks, id, status, index)
{
    const moving = tasks.find((t) => t.id === id);
    if (!moving) return tasks;

    const moved = { ...moving, status };
    const rest = tasks.filter((t) => t.id !== id);
    const column = rest.filter((t) => t.status === status);

    if (index >= column.length)
    {
        return [...rest, moved];
    }

    // Put it just before the task that is currently at that spot in the column
    const before = rest.indexOf(column[index]);
    return [...rest.slice(0, before), moved, ...rest.slice(before)];
}
