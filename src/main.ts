import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan('dev'));
  app.enableCors({
    credentials: true,
    origin: 'http://localhost:3005',
  });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
