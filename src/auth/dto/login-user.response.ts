import { User } from '@prisma/client';

export class LoginUserResponse {
  user: Pick<User, 'id' | 'username'>;
  accessToken: string;
  refreshToken: string;
}
