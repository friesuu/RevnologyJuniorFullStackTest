import { InputType, PartialType } from "@nestjs/graphql";
import { CreateTaskDto } from "./create-task.dto";

@InputType('UpdateTaskInput')
export class UpdateTaskDto extends PartialType(CreateTaskDto){}

