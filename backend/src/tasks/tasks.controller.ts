import { Controller, Get, Post, Body } from '@nestjs/common';
// import { Task, TasksService } from './tasks.service';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './create-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTaskDto): Promise<Task>
  {
    return this.tasksService.create(dto);
  }
}
