import { User } from '@prisma/client';

export class RegisterUserResponse {
  user: User;
  accessToken: string;
}
