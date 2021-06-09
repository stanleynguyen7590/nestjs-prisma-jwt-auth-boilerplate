import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserBody } from './dto/register-user.body';
import { RegisterUserResponse } from './dto/register-user.response';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any): Promise<{ access_token: string }> {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(
    @Body() { username, password }: RegisterUserBody,
  ): Promise<RegisterUserResponse> {
    const user = await this.authService.createUser(username, password);
    if (!user)
      throw new HttpException('User already exists!', HttpStatus.BAD_REQUEST);
    const accessToken = await this.authService.createAccessToken(user);
    const registerUserResponse = new RegisterUserResponse();
    registerUserResponse.user = {
      id: user.id,
      username: user.username,
    };
    registerUserResponse.accessToken = accessToken;
    return registerUserResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req: any) {
    return req.user;
  }
}
