import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { MoveTaskDto } from './move-task.dto';
import { TaskStatus } from './tasks-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      order: {
        position: 'ASC',
        createdAt: 'ASC', // tie-breaker for tasks that share a position (e.g. old rows, all 0)
        id: 'ASC', // ORDER BY in SQL, 'ASC' means in ascending order
      },
    });
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create(dto);
    task.position = await this.nextPosition(task.status ?? TaskStatus.TODO);
    return this.tasksRepository.save(task);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task>
  {
    const task = await this.tasksRepository.findOneBy({id});
    if(!task)
    {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if(dto.title === null || dto.status === null)
    {
      throw new BadRequestException('Title and Status cannot be null');
    }

    // Changing column (e.g. from the dropdown) puts the task at the bottom of the new column
    if(dto.status !== undefined && dto.status !== task.status)
    {
      task.position = await this.nextPosition(dto.status);
    }

    this.tasksRepository.merge(task, dto);
    return this.tasksRepository.save(task);
  }

  // Puts a task at `position` in the `status` column and renumbers that column 0, 1, 2...
  // Runs in a transaction so a half-finished renumbering is never saved.
  async move(id: number, dto: MoveTaskDto): Promise<Task>
  {
    return this.tasksRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Task);

      const task = await repo.findOneBy({id});
      if(!task)
      {
        throw new NotFoundException(`Task ${id} not found`);
      }
      const oldStatus = task.status;

      // The destination column without the moving task, in its current order
      const column = (await this.columnInOrder(repo, dto.status)).filter((t) => t.id !== id);

      // Insert at the requested spot (a number past the end means "at the bottom")
      const index = Math.min(dto.position, column.length);
      task.status = dto.status;
      column.splice(index, 0, task);
      column.forEach((t, i) => { t.position = i; });
      await repo.save(column);

      // Close the gap it left behind in its old column
      if(oldStatus !== dto.status)
      {
        const oldColumn = await this.columnInOrder(repo, oldStatus);
        oldColumn.forEach((t, i) => { t.position = i; });
        await repo.save(oldColumn);
      }

      return task;
    });
  }

  private columnInOrder(repo: Repository<Task>, status: TaskStatus): Promise<Task[]>
  {
    return repo.find({
      where: { status },
      order: { position: 'ASC', createdAt: 'ASC', id: 'ASC' },
    });
  }

  // One past the last position in a column, so a task added there lands at the bottom
  private async nextPosition(status: TaskStatus): Promise<number>
  {
    const last = await this.tasksRepository.findOne({
      where: { status },
      order: { position: 'DESC' },
    });
    return last ? last.position + 1 : 0;
  }

  async remove(id: number): Promise<void>
  {
    const result = await this.tasksRepository.delete(id);

    if( result.affected === 0)
    {
      throw new NotFoundException(`Task ${id} not found`);
    }
  }
}
