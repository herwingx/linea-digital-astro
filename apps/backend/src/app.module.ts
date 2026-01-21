import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { ContentfulModule } from './contentful/contentful.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/backend/.env', '.env'],
    }),
    ChatModule,
    EmailModule,
    ContentfulModule,
  ],
})
export class AppModule { }
