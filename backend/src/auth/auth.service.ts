import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './register.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './login.dto';

@Injectable()
export class AuthService {
    private readonly dummyHash = argon2.hash('not-a-real-password');

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>, private readonly jwtService: JwtService,
  ) {}

    async register(dto: RegisterDto): Promise<User> {
        const existing = await this.usersRepository.findOneBy({ email: dto.email });
        if (existing) throw new ConflictException('Email is already registered');

        const passwordHash = await argon2.hash(dto.password); 
        // .hash is slow on purpose, it's good for security since it's fine for one login but very slow for an attacker trying millions of passwords
        const user = this.usersRepository.create({ email: dto.email, passwordHash });
        return this.usersRepository.save(user);
    }

    async login(dto: LoginDto): Promise<{ user: User; token: string }> {
        const user = await this.usersRepository.findOneBy({ email: dto.email });
        const valid = await argon2.verify(user?.passwordHash ?? await this.dummyHash, dto.password);
        if (!user || !valid) throw new UnauthorizedException('Invalid email or password');

        const token = await this.jwtService.signAsync({ sub: user.id });
        return { user, token };
    }

    async userFromToken(token?: string): Promise<User> {
        if (!token) throw new UnauthorizedException();
        try {
            const { sub } = await this.jwtService.verifyAsync<{ sub: number }>(token);
            const user = await this.usersRepository.findOneBy({ id: sub });
            if (user) return user;
        } catch {
            // forged or expired token: fall through
        }
        throw new UnauthorizedException();
    }

  
}
