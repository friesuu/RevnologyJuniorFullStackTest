import { IsEnum, IsInt, Min } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';
import { TaskStatus } from './tasks-status.enum';

@InputType('MoveTaskInput')
export class MoveTaskDto {
  // The column the task ends up in (can be the same one it's already in)
  @Field(() => TaskStatus)
  @IsEnum(TaskStatus)
  status: TaskStatus;

  // Where in that column: 0 = top. A number past the end puts it at the bottom.
  @Field(() => Int)
  @IsInt()
  @Min(0)
  position: number;
}
