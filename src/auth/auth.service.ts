import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { TokenExpiredError } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
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

  async register(username: string, password: string): Promise<User | null> {
    const oldUser = await this.usersService.findUser({ username });
    if (oldUser) return null;
    const hashedPassword = await argon2.hash(password);
    const user = await this.usersService.createUser({
      username,
      password: hashedPassword,
    });
    return user;
  }

  async generateAccessToken(user: Pick<User, 'username' | 'id'>) {
    const payload = { username: user.username, sub: user.id };
    return await this.jwtService.signAsync(payload);
  }

  async generateRefreshToken(
    user: Pick<User, 'id' | 'username'>,
    expiresIn: number,
  ): Promise<string> {
    const payload = {
      username: user.username,
      sub: user.id,
    };
    return await this.jwtService.signAsync(payload, {
      secret: jwtConstants.refreshTokenSecret,
      expiresIn: expiresIn,
    });
  }

  async resolveRefreshToken(refreshToken: string): Promise<{
    user: Pick<User, 'id' | 'username'>;
  }> {
    try {
      const payload = await this.jwtService.verify(refreshToken, {
        secret: jwtConstants.refreshTokenSecret,
      });
      if (!payload.sub) {
        throw new UnprocessableEntityException('Refresh token malformed');
      }

      const user = await this.prismaService.user.findUnique({
        where: {
          id: parseInt(payload.sub),
        },
      });
      if (!user) {
        throw new UnprocessableEntityException('Refresh token malformed');
      }

      return { user };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Refresh token expired');
      } else {
        throw new UnprocessableEntityException('Refresh token malformed');
      }
    }
  }

  async createAccessTokenFromRefreshToken(refresh: string): Promise<{
    user: Pick<User, 'id' | 'username'>;
    token: string;
  }> {
    const { user } = await this.resolveRefreshToken(refresh);
    const token = await this.generateAccessToken(user);
    return { user, token };
  }
}
