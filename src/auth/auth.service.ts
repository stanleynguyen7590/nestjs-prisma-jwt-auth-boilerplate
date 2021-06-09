import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findUser({ username });
    if (user) {
      const isPasswordValid = await argon2.verify(user.password, password);
      if (isPasswordValid) {
        return user;
      }
    }
    return null;
  }

  async createUser(username: string, password: string): Promise<User | null> {
    const oldUser = await this.usersService.findUser({ username });
    if (oldUser) return null;
    const hashedPassword = await argon2.hash(password);
    const user = await this.usersService.createUser({
      username,
      password: hashedPassword,
    });
    return user;
  }

  async createAccessToken(user: User) {
    const payload = { username: user.username, sub: user.id };
    return await this.jwtService.signAsync(payload);
  }

  async login(user: User): Promise<{ access_token: string }> {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
