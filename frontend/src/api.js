const GRAPHQL_URL = 'http://localhost:3000/graphql';
const TASK_FIELDS = 'id title description status dueDate';

// Validation errors keep their real messages in originalError (as an array);
// other errors have a readable message directly.
function getErrorMessage(error)
{
    const details = error.extensions?.originalError?.message;

    if (Array.isArray(details))
    {
        return details.join(', ');
    }
    return error.message || 'Something went wrong';
}

async function graphqlRequest(query, variables) {
  const response = await fetch(GRAPHQL_URL, { // Fetch by default sends GQL requests into the same origin
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    credentials: 'include' // Sends them to localhost3000 too
    // without credentials, the browsers leaves the cookie out
  });

  const body = await response.json();

  // GraphQL often answers 200 even when it fails, so check errors, not response.ok
  if (body.errors)
  {
    throw new Error(getErrorMessage(body.errors[0]));
  }
  return body.data;
}

export async function getTasks()
{
    const data = await graphqlRequest(`query { tasks { ${TASK_FIELDS} }}`);
    return data.tasks;
}

export async function createTask(input)
{
    const data = await graphqlRequest(
        `mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) { ${TASK_FIELDS} }
        }`,
        { input },
    );
    return data.createTask;
}

export async function updateTask(id, changes)
{
    const data = await graphqlRequest(
        `mutation UpdateTask($id: Int!, $input: UpdateTaskInput!) {
            updateTask(id: $id, input: $input) { ${TASK_FIELDS} }
        }`,
        { id, input: changes },
    );
    return data.updateTask;
}

export async function moveTask(id, status, position)
{
    const data = await graphqlRequest(
        `mutation MoveTask($id: Int!, $input: MoveTaskInput!) {
            moveTask(id: $id, input: $input) { ${TASK_FIELDS} }
        }`,
        { id, input: { status, position } },
    );
    return data.moveTask;
}

export async function deleteTask(id)
{
    await graphqlRequest(
        `mutation DeleteTask($id: Int!) {
            deleteTask(id: $id)
        }`,
        { id },
    );
}
