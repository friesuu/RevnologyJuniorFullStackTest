import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      order: {
        createdAt: 'ASC',
        id: 'ASC', // ORDER BY in SQL, 'ASC' means in ascending order
      },
    });
  }

  create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create(dto);
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

    this.tasksRepository.merge(task, dto);
    return this.tasksRepository.save(task);
  }
}
