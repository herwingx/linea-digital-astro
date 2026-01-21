import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ChatService, ChatMessage } from './chat.service';
import { Response } from 'express';

class ChatRequestDto {
  message: string;
  history: ChatMessage[];
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  async chat(@Body() body: ChatRequestDto, @Res() res: Response) {
    const result = await this.chatService.getResponse(body.message, body.history);

    if (result.error && result.error === 'auth_error') {
      return res.status(HttpStatus.UNAUTHORIZED).json(result);
    }

    return res.status(HttpStatus.OK).json(result);
  }
}
