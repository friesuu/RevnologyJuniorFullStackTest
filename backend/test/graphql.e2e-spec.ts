import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // default import: no braces
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module'; // ../ = go up one folder
import { setupApp } from '../src/app.setup';
import { Task } from '../src/tasks/task.entity';
import { User } from '../src/users/user.entity';

// The account every test runs as. Deleted and re-registered at the start of each run.
const TEST_USER = { email: 'e2e@test.com', password: 'e2e-password' };
// A second account that tries to reach TEST_USER's tasks (ownership tests)
const OTHER_USER = { email: 'e2e-other@test.com', password: 'e2e-password' };

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) { id }
  }
`;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { id }
  }
`;

const ME = `
  query {
    me { id email }
  }
`;

// Each operation is written once and reused. $name = a variable sent separately.
const TASKS = `
  query {
    tasks { id title status }
  }
`;

const CREATE_TASK = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) { id title status dueDate }
  }
`;

const UPDATE_TASK = `
  mutation UpdateTask($id: Int!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) { id title status }
  }
`;

const MOVE_TASK = `
  mutation MoveTask($id: Int!, $input: MoveTaskInput!) {
    moveTask(id: $id, input: $input) { id status position }
  }
`;

const DELETE_TASK = `
  mutation DeleteTask($id: Int!) {
    deleteTask(id: $id)
  }
`;

describe('Tasks GraphQL API (e2e)', () => {
  let app: INestApplication; // set in beforeAll, used by every test
  let tasksRepository: Repository<Task>;
  let usersRepository: Repository<User>;
  let cookie: string[] = []; // TEST_USER's login cookie, sent with every request by gql()
  let otherCookie: string[] = []; // OTHER_USER's login cookie, used by the ownership tests

  // Runs ONCE before all tests: build and start the app, then log both users in
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app); // same CORS + validation as the real app
    await app.init();

    tasksRepository = app.get(getRepositoryToken(Task));
    usersRepository = app.get(getRepositoryToken(User));

    cookie = await registerAndLogIn(TEST_USER);
    otherCookie = await registerAndLogIn(OTHER_USER);
  });

  // Runs ONCE after all tests: shut the app down
  afterAll(async () => {
    await app.close();
  });

  // Runs before EVERY test: start from an empty table
  beforeEach(async () => {
    await tasksRepository.clear();
  });

  // Every GraphQL call is POST /graphql with { query, variables }, sent as whoever owns `who`
  const gqlAs = (who: string[], query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').set('Cookie', who).send({ query, variables });

  // As TEST_USER (most tests)
  const gql = (query: string, variables?: Record<string, unknown>) => gqlAs(cookie, query, variables);

  // As OTHER_USER (ownership tests)
  const gqlAsOther = (query: string, variables?: Record<string, unknown>) =>
    gqlAs(otherCookie, query, variables);

  // With NO cookie, as a logged-out visitor
  const gqlLoggedOut = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  // Fresh account: remove the one from the last run (its tasks go too: ON DELETE CASCADE),
  // register, log in, and return the login cookie. Fails loudly here if logging in is broken.
  const registerAndLogIn = async (user: { email: string; password: string }) => {
    await usersRepository.delete({ email: user.email });
    await gqlLoggedOut(REGISTER, { input: user }).expect(200);
    const login = await gqlLoggedOut(LOGIN, { input: user }).expect(200);
    expect(login.body.errors).toBeUndefined();
    const setCookie = login.headers['set-cookie']; // typed as one string, but can be a list
    return Array.isArray(setCookie) ? setCookie : [setCookie];
  };

  // Setup helper for tests that need an existing task. Fails loudly if creating it fails.
  const createTask = async (input: Record<string, unknown>) => {
    const res = await gql(CREATE_TASK, { input }).expect(200);
    expect(res.body.errors).toBeUndefined();
    return res.body.data.createTask;
  };

  // Titles of one column, in the order the board would show them
  const titlesIn = async (status: string) => {
    const res = await gql(TASKS).expect(200);
    expect(res.body.errors).toBeUndefined();
    return res.body.data.tasks
      .filter((t: { status: string }) => t.status === status)
      .map((t: { title: string }) => t.title);
  };

  // Error shapes (see step 2e):
  //   rejected by the schema      -> HTTP 400, extensions.code BAD_USER_INPUT
  //   rejected by ValidationPipe  -> HTTP 200, data null, messages in extensions.originalError.message
  //   thrown by the service       -> HTTP 200, data null, message in errors[0].message

  describe('login', () => {
    it('blocks task operations without a login cookie', async () => {
      const read = await gqlLoggedOut(TASKS).expect(200);
      expect(read.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');

      const write = await gqlLoggedOut(CREATE_TASK, { input: { title: 'Sneaky' } }).expect(200);
      expect(write.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      expect(await tasksRepository.count()).toBe(0); // and nothing was saved
    });

    it('rejects a made-up token', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', 'token=not-a-real-token')
        .send({ query: TASKS })
        .expect(200);

      expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    it('me returns the logged-in user', async () => {
      const res = await gql(ME).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.me.email).toBe(TEST_USER.email);
    });

    // supertest isn't a browser and won't delete the cookie itself, so we check the instruction
    // the server sends: "token is now empty and expired in 1970". The saved test cookie keeps
    // working afterwards, because a JWT can't be cancelled: logout only removes it from the browser.
    it('logout tells the browser to delete the cookie', async () => {
      const res = await gql(`mutation { logout }`).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.logout).toBe(true);

      const setCookie = String(res.headers['set-cookie']);
      expect(setCookie).toContain('token=;');
      expect(setCookie).toContain('Expires=Thu, 01 Jan 1970');
      expect(setCookie).toContain('HttpOnly'); // same options as login, or browsers won't clear it
    });

    it('logout also works when not logged in', async () => {
      const res = await gqlLoggedOut(`mutation { logout }`).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.logout).toBe(true);
    });
  });

  // OTHER_USER tries every way to reach TEST_USER's tasks. Each attempt must look exactly like
  // "this task doesn't exist", so an attacker can't even learn that the task is there.
  describe('ownership (another user)', () => {
    it('does not see my tasks', async () => {
      await createTask({ title: 'Mine' });

      const res = await gqlAsOther(TASKS).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.tasks).toEqual([]);
    });

    it('cannot update my task', async () => {
      const mine = await createTask({ title: 'Mine' });

      const res = await gqlAsOther(UPDATE_TASK, {
        id: mine.id,
        input: { title: 'Hacked' },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].message).toBe(`Task ${mine.id} not found`);
      expect(await titlesIn('TODO')).toEqual(['Mine']); // unchanged
    });

    it('cannot move my task', async () => {
      const mine = await createTask({ title: 'Mine' });

      const res = await gqlAsOther(MOVE_TASK, {
        id: mine.id,
        input: { status: 'DONE', position: 0 },
      }).expect(200);

      expect(res.body.errors[0].message).toBe(`Task ${mine.id} not found`);
      expect(await titlesIn('TODO')).toEqual(['Mine']); // still in its column
      expect(await titlesIn('DONE')).toEqual([]);
    });

    it('cannot delete my task', async () => {
      const mine = await createTask({ title: 'Mine' });

      const res = await gqlAsOther(DELETE_TASK, { id: mine.id }).expect(200);

      expect(res.body.errors[0].message).toBe(`Task ${mine.id} not found`);
      expect(await titlesIn('TODO')).toEqual(['Mine']); // still there
    });

    it('gets the same kind of error for my task as for a task that does not exist', async () => {
      const mine = await createTask({ title: 'Mine' });

      const forMine = await gqlAsOther(DELETE_TASK, { id: mine.id }).expect(200);
      const forNothing = await gqlAsOther(DELETE_TASK, { id: 999999 }).expect(200);

      expect(forMine.body.errors[0].extensions.code).toBe(forNothing.body.errors[0].extensions.code);
      expect(forMine.body.errors[0].message).toBe(`Task ${mine.id} not found`);
      expect(forNothing.body.errors[0].message).toBe('Task 999999 not found');
    });

    it('does not show their tasks in my list', async () => {
      await gqlAsOther(CREATE_TASK, { input: { title: 'Theirs' } }).expect(200);

      expect(await titlesIn('TODO')).toEqual([]);
    });

    it('keeps separate column order for each user', async () => {
      await createTask({ title: 'A' });
      const b = await createTask({ title: 'B' });
      const theirs = await gqlAsOther(CREATE_TASK, { input: { title: 'Theirs' } }).expect(200);
      const theirsId = theirs.body.data.createTask.id;

      // Their first task is at the top of THEIR column, even though I already have two
      expect((await tasksRepository.findOneByOrFail({ id: theirsId })).position).toBe(0);

      // Reordering my column doesn't renumber theirs
      await gql(MOVE_TASK, { id: b.id, input: { status: 'TODO', position: 0 } }).expect(200);
      expect(await titlesIn('TODO')).toEqual(['B', 'A']);
      expect((await tasksRepository.findOneByOrFail({ id: theirsId })).position).toBe(0);
    });
  });

  describe('createTask', () => {
    it('creates a task and trims it', async () => {
      const res = await gql(CREATE_TASK, {
        input: { title: '   Buy Milk   ', dueDate: '2026-10-05' },
      }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createTask.title).toBe('Buy Milk');
      expect(res.body.data.createTask.status).toBe('TODO'); // enum NAME, not 'todo'
      expect(res.body.data.createTask.id).toBeDefined();
    });

    it('rejects an empty title', async () => {
      const res = await gql(CREATE_TASK, { input: { title: '' } }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].extensions.originalError.message).toContain(
        'title should not be empty',
      );
    });

    it('rejects a title of only spaces', async () => {
      const res = await gql(CREATE_TASK, { input: { title: '   ' } }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].extensions.originalError.message).toContain(
        'title should not be empty',
      );
    });

    it('rejects an unknown status', async () => {
      const res = await gql(CREATE_TASK, {
        input: { title: 'x', status: 'DOING' },
      }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });

    it('rejects an impossible date', async () => {
      const res = await gql(CREATE_TASK, {
        input: { title: 'x', dueDate: '2026-02-30' },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
    });

    it('rejects unknown fields', async () => {
      const res = await gql(CREATE_TASK, {
        input: { title: 'x', priority: 'high' },
      }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });

    it('accepts 100 characters, rejects 101', async () => {
      await createTask({ title: 'a'.repeat(100) });

      const res = await gql(CREATE_TASK, {
        input: { title: 'a'.repeat(101) },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
    });
  });

  describe('tasks query', () => {
    it('returns tasks in creation order', async () => {
      await createTask({ title: 'First' });
      await createTask({ title: 'Second' });

      const res = await gql(TASKS).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.tasks.map((t: { title: string }) => t.title)).toEqual([
        'First',
        'Second',
      ]);
    });

    it('returns only the fields that were asked for', async () => {
      await createTask({ title: 'Only id please' });

      const res = await gql(`query { tasks { id } }`).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.tasks[0].id).toBeDefined();
      expect(res.body.data.tasks[0].title).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('changes the status and keeps the other fields', async () => {
      const created = await createTask({ title: 'Write report' });

      const res = await gql(UPDATE_TASK, {
        id: created.id,
        input: { status: 'IN_PROGRESS' },
      }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateTask.status).toBe('IN_PROGRESS');
      expect(res.body.data.updateTask.title).toBe('Write report');
    });

    it('rejects an unknown status', async () => {
      const created = await createTask({ title: 'Write report' });

      const res = await gql(UPDATE_TASK, {
        id: created.id,
        input: { status: 'DOING' },
      }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });

    it('returns an error for a task that doesnt exist', async () => {
      const res = await gql(UPDATE_TASK, {
        id: 999999,
        input: { status: 'DONE' },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].message).toContain('Task 999999 not found');
    });

    it('rejects a non-numeric id', async () => {
      const res = await gql(UPDATE_TASK, {
        id: 'abc',
        input: { status: 'DONE' },
      }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });

    it('rejects a null title', async () => {
      const created = await createTask({ title: 'Write report' });

      // The schema and ValidationPipe both allow null here; the service is what stops it
      const res = await gql(UPDATE_TASK, {
        id: created.id,
        input: { title: null },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].message).toContain('cannot be null');
    });
  });

  describe('moveTask', () => {
    it('moves a task up inside its column', async () => {
      await createTask({ title: 'A' });
      await createTask({ title: 'B' });
      const c = await createTask({ title: 'C' });

      const res = await gql(MOVE_TASK, {
        id: c.id,
        input: { status: 'TODO', position: 0 },
      }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(await titlesIn('TODO')).toEqual(['C', 'A', 'B']);
    });

    it('moves a task down inside its column', async () => {
      const a = await createTask({ title: 'A' });
      await createTask({ title: 'B' });
      await createTask({ title: 'C' });

      await gql(MOVE_TASK, { id: a.id, input: { status: 'TODO', position: 2 } }).expect(200);

      expect(await titlesIn('TODO')).toEqual(['B', 'C', 'A']);
    });

    it('moves a task between two tasks of another column', async () => {
      const a = await createTask({ title: 'A' });
      await createTask({ title: 'B' });
      await createTask({ title: 'X', status: 'DONE' });
      await createTask({ title: 'Y', status: 'DONE' });

      const res = await gql(MOVE_TASK, {
        id: a.id,
        input: { status: 'DONE', position: 1 },
      }).expect(200);

      expect(res.body.data.moveTask.status).toBe('DONE');
      expect(await titlesIn('DONE')).toEqual(['X', 'A', 'Y']);
      expect(await titlesIn('TODO')).toEqual(['B']);
    });

    it('puts a task at the bottom when the position is past the end', async () => {
      const a = await createTask({ title: 'A' });
      await createTask({ title: 'X', status: 'DONE' });

      await gql(MOVE_TASK, { id: a.id, input: { status: 'DONE', position: 99 } }).expect(200);

      expect(await titlesIn('DONE')).toEqual(['X', 'A']);
    });

    it('adds new tasks at the bottom of their column', async () => {
      await createTask({ title: 'A' });
      const b = await createTask({ title: 'B' });
      await gql(MOVE_TASK, { id: b.id, input: { status: 'TODO', position: 0 } }).expect(200);

      await createTask({ title: 'C' });

      expect(await titlesIn('TODO')).toEqual(['B', 'A', 'C']);
    });

    it('puts a task at the bottom of the new column when its status is changed', async () => {
      await createTask({ title: 'X', status: 'DONE' });
      const a = await createTask({ title: 'A' });

      await gql(UPDATE_TASK, { id: a.id, input: { status: 'DONE' } }).expect(200);

      expect(await titlesIn('DONE')).toEqual(['X', 'A']);
    });

    it('rejects a negative position', async () => {
      const a = await createTask({ title: 'A' });

      const res = await gql(MOVE_TASK, {
        id: a.id,
        input: { status: 'TODO', position: -1 },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
    });

    it('returns an error for a task that doesnt exist', async () => {
      const res = await gql(MOVE_TASK, {
        id: 999999,
        input: { status: 'TODO', position: 0 },
      }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].message).toContain('Task 999999 not found');
    });
  });

  describe('deleteTask', () => {
    it('deletes a task', async () => {
      const created = await createTask({ title: 'Write report' });

      const res = await gql(DELETE_TASK, { id: created.id }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteTask).toBe(true);

      const after = await gql(TASKS).expect(200);
      expect(after.body.data.tasks).toHaveLength(0);
    });

    it('returns an error for a task that doesnt exist', async () => {
      const res = await gql(DELETE_TASK, { id: 999999 }).expect(200);

      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].message).toContain('Task 999999 not found');
    });

    it('rejects a non-numeric id', async () => {
      const res = await gql(DELETE_TASK, { id: 'abc' }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
  });
});
