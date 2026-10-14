import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { User } from "../users/user.entity";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  GqlExecutionContext.create(context).getContext<{ req: { user: User } }>().req.user,
); 

// This file gives the resolver methods the logged in user.
// Only works on method protected by the guard (GQL auth guard)
// If the way user is stored changes, we only need to change this file instead of every file.