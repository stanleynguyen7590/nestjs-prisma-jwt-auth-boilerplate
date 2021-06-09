import { User } from '@prisma/client';

export class RegisterUserResponse {
  user: Pick<User, 'id' | 'username'>;
  accessToken: string;
}
