import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ContentfulModule } from '../contentful/contentful.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, ContentfulModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule { }
