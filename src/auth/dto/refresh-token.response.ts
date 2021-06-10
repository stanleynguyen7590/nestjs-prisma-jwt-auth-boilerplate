import { User } from '@prisma/client';

export class RefreshTokenResponse {
  user: Pick<User, 'id' | 'username'>;
  accessToken: string;
}
