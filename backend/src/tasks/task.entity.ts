import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TaskStatus } from './tasks-status.enum';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../users/user.entity';

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

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' }) // Many tasks belong to one user
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', type: 'int', nullable: false })
  ownerId: number;
}
