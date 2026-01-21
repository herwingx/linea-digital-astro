import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { EmailService, EmailData } from './email.service';
import { Response } from 'express';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @Post('send')
  async sendEmail(@Body() data: EmailData, @Res() res: Response) {
    try {
      if (!data.name || !data.email || !data.message) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "Faltan campos obligatorios." });
      }
      await this.emailService.sendContactEmail(data);
      return res.status(HttpStatus.OK).json({ message: "Mensaje enviado exitosamente." });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Error interno al enviar el correo.",
        details: error.message
      });
    }
  }

  @Post('subscribe')
  async subscribe(@Body('email') email: string, @Res() res: Response) {
    if (!email || !email.includes('@')) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Email inválido" });
    }
    try {
      const result = await this.emailService.subscribeToNewsletter(email);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error inesperado."
      });
    }
  }
}
