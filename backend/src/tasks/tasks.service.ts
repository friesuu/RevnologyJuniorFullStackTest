import { Injectable } from '@nestjs/common';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  createdAt: string;
}

@Injectable()
export class TasksService {
  findAll(): Task[] {
    return [
      {
        id: 1,
        title: 'test',
        description: 'test',
        status: 'todo',
        dueDate: '2026-08-01',
        createdAt: '2026-09-29T10:00:00.000Z',
      },
      {
        id: 2,
        title: 'test2',
        description: 'test',
        status: 'in_progress',
        dueDate: '2026-09-01',
        createdAt: '2026-09-28T10:00:00.000Z',
      },
      {
        id: 3,
        title: 'DoneTest',
        description: 'test',
        status: 'done',
        dueDate: '2026-09-28',
        createdAt: '2026-09-28T10:00:00.000Z',
      },
    ];
  }
}
