export const prerender = false;

import type { APIRoute } from "astro";
import * as Brevo from "@getbrevo/brevo";

// Validación de email mejorada
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const email = data.get("email");

    // Validación de entrada
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Por favor ingresa un correo válido."
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validación de configuración
    const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;
    const BREVO_LIST_ID = Number(import.meta.env.BREVO_LIST_ID);

    if (!BREVO_API_KEY || !BREVO_LIST_ID) {
      console.error("Missing Brevo configuration");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error de configuración del servidor."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Configurar API de Brevo
    const apiInstance = new Brevo.ContactsApi();
    apiInstance.setApiKey(Brevo.ContactsApiApiKeys.apiKey, BREVO_API_KEY);

    // Intentar crear contacto
    const createContact = new Brevo.CreateContact();
    createContact.email = email;
    createContact.listIds = [BREVO_LIST_ID];
    createContact.updateEnabled = true;

    try {
      await apiInstance.createContact(createContact);

      return new Response(
        JSON.stringify({
          success: true,
          message: "¡Gracias por unirte al Círculo VIP!",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } catch (apiError: any) {
      // Si el contacto ya existe (error 400), intentar actualizar
      if (apiError.response?.statusCode === 400) {
        try {
          const updateContact = new Brevo.UpdateContact();
          updateContact.listIds = [BREVO_LIST_ID];

          await apiInstance.updateContact(email, updateContact);

          return new Response(
            JSON.stringify({
              success: true,
              message: "¡Ya estás en la lista! Datos actualizados.",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch {
          // Si falla la actualización, asumir que ya está suscrito
          return new Response(
            JSON.stringify({
              success: true,
              message: "Ya estás suscrito a nuestro boletín.",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // Error desconocido de la API
      console.error("Brevo API error:", apiError.response?.statusCode);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Hubo un problema al registrarte. Intenta de nuevo.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Subscription error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error inesperado. Por favor intenta más tarde."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};