import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { cookiesKey } from './constants';
import { LoginUserResponse } from './dto/login-user.response';
import { RefreshTokenResponse } from './dto/refresh-token.response';
import { RegisterUserBody } from './dto/register-user.body';
import { RegisterUserResponse } from './dto/register-user.response';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Req() req: any,
  ): Promise<LoginUserResponse> {
    const accessToken = await this.authService.generateAccessToken(req.user);
    const refreshToken = await this.authService.generateRefreshToken(
      req.user,
      60 * 60 * 24 * 30,
    );
    const loginUserResponse = new LoginUserResponse();
    loginUserResponse.user = {
      id: req.user.id,
      username: req.user.username,
    };
    loginUserResponse.accessToken = accessToken;
    loginUserResponse.refreshToken = refreshToken;
    res.cookie(cookiesKey.refreshToken, refreshToken, {
      httpOnly: true,
      path: '/refresh',
    });
    return loginUserResponse;
  }

  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() { username, password }: RegisterUserBody,
  ): Promise<RegisterUserResponse> {
    const user = await this.authService.register(username, password);
    if (!user)
      throw new HttpException('User already exists!', HttpStatus.BAD_REQUEST);
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(
      user,
      60 * 60 * 24 * 30,
    );
    const registerUserResponse = new RegisterUserResponse();
    registerUserResponse.user = {
      id: user.id,
      username: user.username,
    };
    res.cookie(cookiesKey.refreshToken, refreshToken, {
      httpOnly: true,
      path: '/refresh',
    });
    registerUserResponse.accessToken = accessToken;
    registerUserResponse.refreshToken = refreshToken;
    return registerUserResponse;
  }

  @Post('refresh')
  async refresh(
    @Body() { refreshToken }: { refreshToken: string },
  ): Promise<RefreshTokenResponse> {
    const { user, token } =
      await this.authService.createAccessTokenFromRefreshToken(refreshToken);

    const refreshTokenResponse = new RefreshTokenResponse();
    refreshTokenResponse.user = { username: user.username, id: user.id };
    refreshTokenResponse.accessToken = token;
    return refreshTokenResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Get('secret')
  async getSecret() {
    return 'This is a secret';
  }
}
