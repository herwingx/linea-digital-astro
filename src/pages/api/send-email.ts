// src/pages/api/send-email.ts
import 'dotenv/config';
import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

interface EmailData {
  name: string;
  email: string;
  message: string;
  phone?: string;
}

export const POST: APIRoute = async ({ request }) => {
  // 1. Validación de Headers
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return new Response(JSON.stringify({ error: "Solicitud no válida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await request.text();
    if (!rawBody) {
      throw new Error("Request body is empty.");
    }
    const data: EmailData = JSON.parse(rawBody);

    const { name, email, message, phone } = data;

    // 2. Validación de Datos
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          error: "Por favor, completa todos los campos requeridos.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Configuración de Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === 'true', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED === 'true',
      },
    });

    // --- TEMPLATE HTML MEJORADO (CLEAN UI) ---
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #F8FAFC; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0; margin-top: 40px; margin-bottom: 40px; }
    .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E2E8F0; }
    .logo-text { color: #1E293B; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .logo-accent { color: #2563EB; }
    .content { padding: 40px 30px; }
    .label-tag { display: inline-block; background-color: #EFF6FF; color: #2563EB; padding: 6px 12px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .main-title { color: #0F172A; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.2; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .info-row td { padding: 12px 0; border-bottom: 1px solid #F1F5F9; color: #334155; font-size: 15px; }
    .info-label { font-weight: 600; color: #64748B; width: 120px; }
    .message-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-top: 10px; color: #334155; line-height: 1.6; font-size: 15px; white-space: pre-wrap; }
    .cta-button { display: block; width: fit-content; background-color: #2563EB; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; text-align: center; margin-top: 30px; margin-bottom: 10px; font-size: 14px; }
    .footer { background-color: #F1F5F9; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; }
    .link-reset { color: #2563EB; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    
    <!-- Header -->
    <div class="header">
      <div class="logo-text">Línea<span class="logo-accent">Digital</span></div>
    </div>

    <!-- Body -->
    <div class="content">
      <span class="label-tag">Nuevo Lead Web</span>
      <h1 class="main-title">¡Tienes un nuevo mensaje de contacto!</h1>
      
      <p style="color: #64748B; margin-bottom: 25px; font-size: 15px;">
        Un cliente potencial ha completado el formulario de contacto en el sitio web. Aquí están los detalles:
      </p>

      <!-- Detalles -->
      <table class="info-table">
        <tr class="info-row">
          <td class="info-label">Nombre</td>
          <td style="font-weight: 600;">${name}</td>
        </tr>
        <tr class="info-row">
          <td class="info-label">Email</td>
          <td><a href="mailto:${email}" class="link-reset">${email}</a></td>
        </tr>
        ${phone ? `
        <tr class="info-row">
          <td class="info-label">Teléfono</td>
          <td><a href="tel:${phone}" class="link-reset" style="color:#334155; text-decoration:none;">${phone}</a></td>
        </tr>` : ""}
      </table>

      <!-- Mensaje Box -->
      <div style="color: #64748B; font-weight: 600; font-size: 14px; margin-bottom: 5px;">Mensaje del cliente:</div>
      <div class="message-box">
        "${message.replace(/\n/g, "<br>")}"
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="mailto:${email}?subject=Respuesta%20a%20su%20consulta%20-%20Línea%20Digital&body=Hola%20${name},%0A%0AHemos%20recibido%20tu%20mensaje..." class="cta-button">
          Responder Directamente
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      Este es un mensaje automático enviado desde <strong>linea-digital.com</strong>.<br>
      No es necesario responder a este correo automático.
    </div>

  </div>
</body>
</html>
    `;

    // 4. Enviar correo
    const mailOptions = {
      from: `"Formulario Web" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      replyTo: `${name} <${email}>`,
      subject: `✨ Nuevo Contacto: ${name}`, // Subject con emoji para destacar en la bandeja
      html: htmlTemplate,
      text: `Nuevo mensaje de ${name} (${email})\n${phone ? `Teléfono: ${phone}\n` : ""}\nMensaje:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        message:
          "¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error al enviar el correo:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({
        error:
          "Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};