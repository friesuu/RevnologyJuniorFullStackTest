import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // default import: no braces
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module'; // ../ = go up one folder
import { setupApp } from '../src/app.setup';
import { Task } from '../src/tasks/task.entity';

describe('Tasks API (e2e)', () => {
  let app: INestApplication; // set in beforeAll, used by every test
  let tasksRepository: Repository<Task>;

  // Runs ONCE before all tests: build and start the app
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app); // same CORS + validation as the real app
    await app.init();

    tasksRepository = app.get(getRepositoryToken(Task));
  });

  // Runs ONCE after all tests: shut the app down
  afterAll(async () => {
    await app.close();
  });

  // Runs before EVERY test: start from an empty table
  beforeEach(async () => {
    await tasksRepository.clear();
  });

  describe('POST /tasks', () => {
    it('creates a task and trims it', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: '   Buy Milk   ', dueDate: '2026-10-05' })
        .expect(201);

      expect(res.body.title).toBe('Buy Milk');
      expect(res.body.status).toBe('todo');
      expect(res.body.id).toBeDefined();
    });

    it('rejects an empty title', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: '' })
        .expect(400);

      expect(res.body.message).toContain('title should not be empty');
    });

    it('rejects a title of only spaces', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: '   ', dueDate: '2026-10-05' })
        .expect(400);
    });

    it('rejects an unknown status', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'x', status: 'doing' })
        .expect(400);
    });

    it('rejects an impossible date', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'x', dueDate: '2026-02-30' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'x', priority: 'high' })
        .expect(400);
    });

    it('accepts 100 characters, rejects 101', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'a'.repeat(100) })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'a'.repeat(101) })
        .expect(400);
    });
  });

  describe('GET /tasks', () => {
    it('returns tasks in creation order', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'First' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Second' })
        .expect(201);

      const res = await request(app.getHttpServer()).get('/tasks').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map((t: { title: string }) => t.title)).toEqual([
        'First',
        'Second',
      ]);
    });
    });

    describe('PATCH /tasks/:id', () => {
        it('changes the status and keeps the other fields', async () => {
            const created = await request(app.getHttpServer())
            .post('/tasks')
            .send({ title: 'Write report' })
            .expect(201);

            const id = created.body.id;

            const res = await request(app.getHttpServer())
            .patch(`/tasks/${id}`)
            .send({ status: 'in_progress' })
            .expect(200);

            expect(res.body.status).toBe('in_progress');
            expect(res.body.title).toBe('Write report');
        });

        it('rejects an unknown status', async () => {
            const created = await request(app.getHttpServer())
            .post('/tasks')
            .send({ title: 'Write report' })
            .expect(201);

            const id = created.body.id;

            await request(app.getHttpServer())
            .patch(`/tasks/${id}`)
            .send({ status: 'doing' })
            .expect(400);
        });

        it('returns 404 for a task that doesnt exist', async () => {
            const created = await request(app.getHttpServer())
            .post('/tasks')
            .send({ title: 'Write report' })
            .expect(201);

            const id = created.body.id;

            const res = await request(app.getHttpServer())
            .patch(`/tasks/999999`)
            .expect(404);

            expect(res.body.message).toContain('Task 999999 not found');
        });

        it('rejects a non-numeric id', async () => {
            await request(app.getHttpServer())
            .post('/tasks')
            .send({ title: 'Write report' })
            .expect(201);

            const res = await request(app.getHttpServer())
            .patch(`/tasks/abc`)
            .expect(400);
        });

        it('rejects a null title', async () => {
            const created = await request(app.getHttpServer())
            .post('/tasks')
            .send({ title: 'Write report' })
            .expect(201);

            const id = created.body.id;

            await request(app.getHttpServer())
            .patch(`/tasks/${id}`)
            .send({ title: null })
            .expect(400);
        });
    });

    describe('DELETE /tasks/:id', () => {
        it('deletes a task', async () => {
            const created = await request(app.getHttpServer())
            .post('/tasks')
            .send({ title: 'Write report' })
            .expect(201);

            const id = created.body.id;
            await request(app.getHttpServer())
            .delete(`/tasks/${id}`)
            .expect(204);

            const res = await request(app.getHttpServer())
            .get('/tasks')
            .expect(200);

            expect(res.body).toHaveLength(0);
        })

        it('returns 404 for a task that doesnt exist', async () => {
            await request(app.getHttpServer())
            .delete(`/tasks/999999`)
            .expect(404);
        })

        it('rejects a non-numeric id', async () => {
            await request(app.getHttpServer())
            .delete(`/tasks/abc`)
            .expect(400);
        })
    });
});
