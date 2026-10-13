import { Query, Resolver } from "@nestjs/graphql";
import { TasksService } from "./tasks.service";
import { Task } from "./task.entity";

@Resolver(() => Task)
export class TaskResolver
{
    constructor(private readonly tasksService: TasksService){}
    @Query(() => [Task], { name: 'tasks'})
    findAll(): Promise<Task[]> {
        return this.tasksService.findAll();
    }
}