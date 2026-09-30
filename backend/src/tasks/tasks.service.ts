import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';



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
}
