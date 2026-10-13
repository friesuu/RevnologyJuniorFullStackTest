import { registerEnumType } from "@nestjs/graphql";

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

registerEnumType(TaskStatus, { name: 'TaskStatus'});
