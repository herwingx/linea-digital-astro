import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Brevo from '@getbrevo/brevo';

export interface EmailData {
  name: string;
  email: string;
  message: string;
  phone?: string;
  subject?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private brevoApi: Brevo.ContactsApi;

  constructor(private configService: ConfigService) {
    this.initNodemailer();
    this.initBrevo();
  }

  private initNodemailer() {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT') || 587;
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const secure = this.configService.get<string>('EMAIL_SECURE') === 'true';

    if (!host || !user || !pass) {
      this.logger.error('Nodemailer configuration missing');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  private initBrevo() {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (apiKey) {
      this.brevoApi = new Brevo.ContactsApi();
      this.brevoApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, apiKey);
    } else {
      this.logger.error('Brevo API Key missing');
    }
  }

  async sendContactEmail(data: EmailData): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const { name, email, message, phone, subject } = data;
    const from = this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('EMAIL_USER');
    const to = this.configService.get<string>('EMAIL_TO');

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; background-color: #f4f4f5; padding: 20px; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #2563EB; padding: 20px; text-align: center; color: white; }
          .content { padding: 30px; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; display: block; }
          .value { font-size: 16px; font-weight: 500; }
          .message-box { background: #f8fafc; border-left: 4px solid #2563EB; padding: 15px; margin-top: 10px; white-space: pre-wrap; }
          .footer { text-align: center; font-size: 12px; color: #9ca3af; padding: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Nuevo Lead Web 🚀</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Departamento</span>
              <div class="value">${subject || 'General'}</div>
            </div>
            <div class="field">
              <span class="label">Nombre / Empresa</span>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <span class="label">Contacto</span>
              <div class="value">
                <a href="mailto:${email}">${email}</a>
                ${phone ? `<br><a href="tel:${phone}">${phone}</a>` : ''}
              </div>
            </div>
            <div class="field">
              <span class="label">Mensaje</span>
              <div class="message-box">${message}</div>
            </div>
          </div>
          <div class="footer">
            Enviado desde el formulario de contacto de linea-digital.com
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Web Lead" <${from}>`,
        to: to,
        replyTo: email,
        subject: `[WEB] ${subject?.toUpperCase() || 'GENERAL'} - ${name}`,
        text: `Nuevo mensaje de ${name} (${email}):\n\n${message}`,
        html: htmlTemplate,
      });
      return true;
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }

  async subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string; status?: string }> {
    if (!this.brevoApi) {
      return { success: false, message: 'Servicio de suscripción no disponible.' };
    }

    const listId = Number(this.configService.get<number>('BREVO_LIST_ID'));
    if (!listId) {
      return { success: false, message: 'Configuración incorrecta.' };
    }

    const createContact = new Brevo.CreateContact();
    createContact.email = email;
    createContact.listIds = [listId];
    createContact.updateEnabled = false;

    try {
      await this.brevoApi.createContact(createContact);
      return { success: true, message: "¡Bienvenido al Círculo VIP!", status: 'new' };
    } catch (error: any) {
      if (error.response?.statusCode === 400 || error.body?.code === 'duplicate_parameter') {
        try {
          const updateContact = new Brevo.UpdateContact();
          updateContact.listIds = [listId];
          await this.brevoApi.updateContact(email, updateContact);
          return { success: true, message: "¡Ya eres parte de la comunidad!", status: 'updated' };
        } catch (updateError) {
          return { success: true, message: "¡Ya estás registrado!", status: 'exists' };
        }
      }
      this.logger.error('Brevo Detailed Error', JSON.stringify(error.body || error, null, 2));
      throw new Error('Error al suscribir');
    }
  }
}
