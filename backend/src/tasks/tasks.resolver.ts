import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { TasksService } from "./tasks.service";
import { Task } from "./task.entity";
import { CreateTaskDto } from "./create-task.dto";
import { UpdateTaskDto } from "./update-task.dto";
import { MoveTaskDto } from "./move-task.dto";

@Resolver(() => Task)
export class TaskResolver
{
    constructor(private readonly tasksService: TasksService){}
    @Query(() => [Task], { name: 'tasks'})
    findAll(): Promise<Task[]> {
        return this.tasksService.findAll();
    }
    
    @Mutation(() => Task)
    createTask(@Args( 'input') input: CreateTaskDto): Promise<Task>
    {
        return this.tasksService.create(input);
    }

    @Mutation(() => Task) // What client will receive from after the database operation is done (Task object with id, title and status)
    updateTask(
        @Args('id', { type: () => Int}) id: number,
        @Args('input') input: UpdateTaskDto
    ): Promise<Task>{
        return this.tasksService.update(id, input);
    }

    // Drag and drop: put a task at a position in a column (same or different one)
    @Mutation(() => Task)
    moveTask(
        @Args('id', { type: () => Int}) id: number,
        @Args('input') input: MoveTaskDto
    ): Promise<Task>{
        return this.tasksService.move(id, input);
    }

    @Mutation(() => Boolean)
    async deleteTask(@Args('id', { type: () => Int}) id: number):
    Promise<boolean>{
        await this.tasksService.remove(id);
        return true;
    }
}