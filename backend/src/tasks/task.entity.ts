import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { TaskStatus } from './tasks-status.enum';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('tasks')
export class Task {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ length: 100 })
  title: string;

  @Field(() => String, {nullable: true})
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Field(() => TaskStatus)
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Field(() => String, {nullable: true})
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  // Order inside its column: 0 = top. Only compared between tasks with the same status.
  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  position: number;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
