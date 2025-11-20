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

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          error: "Por favor, completa todos los campos requeridos.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Configuración del transporte de correo
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === 'true', // O usa `true` si tu puerto es 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED === 'true',
      },
    });

    // Configurar el correo
    const mailOptions = {
      from: `"Formulario Web" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      replyTo: `${name} <${email}>`,
      subject: `Nuevo mensaje de ${name} - Formulario Web`,
      html: `
        <h2>Nuevo mensaje del formulario de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p>Este mensaje fue enviado desde el formulario de contacto del sitio web.</p>
      `,
      text: `Nuevo mensaje de ${name} (${email})${phone ? ` - Teléfono: ${phone}` : ""
        }:\n\n${message}`,
    };

    // Enviar el correo
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