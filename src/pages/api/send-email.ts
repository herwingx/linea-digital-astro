// src/pages/api/send-email.ts
export const prerender = false; // API Route

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Definición estricta de datos esperados
interface EmailData {
  name: string;
  email: string;
  message: string;
  phone?: string;
  subject?: string; // Nuevo campo
}

export const POST: APIRoute = async ({ request }) => {
  // 1. Content-Type Check
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), { status: 400 });
  }

  try {
    const rawBody = await request.text();
    if (!rawBody) throw new Error("Cuerpo de solicitud vacío.");

    const data: EmailData = JSON.parse(rawBody);
    const { name, email, message, phone, subject } = data;

    // 2. Validación de Campos
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios." }),
        { status: 400 }
      );
    }

    // 3. Validación de Configuración (DEBUG)
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = import.meta.env;

    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      console.error("❌ ERROR CONFIG: Faltan variables de entorno de correo.");
      console.error("HOST:", EMAIL_HOST);
      console.error("USER:", EMAIL_USER ? "******" : "MISSING");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor (Missing Env Vars)." }),
        { status: 500 }
      );
    }

    // 4. Nodemailer Config
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT) || 587,
      secure: import.meta.env.EMAIL_SECURE === 'true',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        // Aceptar certificados auto-firmados (común en servidores corporativos)
        rejectUnauthorized: false
      }
    });

    // 5. Template HTML (Diseño Corporativo Limpio)
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

    // 6. Envío
    await transporter.sendMail({
      from: `"Web Lead" <${import.meta.env.EMAIL_FROM || EMAIL_USER}>`,
      to: import.meta.env.EMAIL_TO,
      replyTo: email,
      subject: `[WEB] ${subject?.toUpperCase() || 'GENERAL'} - ${name}`,
      text: `Nuevo mensaje de ${name} (${email}):\n\n${message}`,
      html: htmlTemplate,
    });

    return new Response(
      JSON.stringify({ message: "Mensaje enviado exitosamente." }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Send Mail Error Completo:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno al enviar el correo.",
        details: error.message // Enviamos detalle para debug
      }),
      { status: 500 }
    );
  }
};