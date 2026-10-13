import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus } from './tasks-status.enum';
import { Field, InputType } from '@nestjs/graphql';

@InputType('CreateTaskInput')
export class CreateTaskDto {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @Field(() => String, {nullable: true})
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => String, {nullable: true})
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dueDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  dueDate?: string;
}
