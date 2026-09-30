import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './create-task.dto';



@Injectable()
export class TasksService 
{
    constructor(
        @InjectRepository(Task) 
    private readonly tasksRepository: Repository<Task>,){}


  findAll(): Promise<Task[]> 
  {
    return this.tasksRepository.find({order: {
        createdAt: 'ASC', id: 'ASC' // ORDER BY in SQL, 'ASC' means in ascending order
        },
    });
  }

  create(dto: CreateTaskDto): Promise<Task>
  {
    const task = this.tasksRepository.create(dto);
    return this.tasksRepository.save(task);
  }
}
