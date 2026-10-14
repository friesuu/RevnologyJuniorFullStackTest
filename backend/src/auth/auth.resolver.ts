import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { User } from "../users/user.entity";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./register.dto";
import { LoginDto } from "./login.dto";
import type { Request, Response } from 'express';
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "./gql-auth.guard";
import { CurrentUser } from "./current-user.decorator";

@Resolver(() => User)
export class AuthResolver
{
    constructor(private readonly authService: AuthService){}

    @Mutation(() => User)
    register(@Args( 'input') input: RegisterDto): Promise<User>
    {
        return this.authService.register(input)
    }

    @Mutation(() => User)
    async login(@Args('input') input: LoginDto, @Context() ctx: { res: Response }): Promise<User> {
        const { user, token } = await this.authService.login(input);
        ctx.res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        });
        return user;
        }

    @Query(() => User)
        @UseGuards(GqlAuthGuard)
        me(@CurrentUser() user: User): User { // Returns current user
        return user;
    }
}