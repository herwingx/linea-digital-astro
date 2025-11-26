export const prerender = false; // Server-side only

import type { APIRoute } from "astro";
import { ContactsApi, CreateContact } from "@getbrevo/brevo";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const email = data.get("email");

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ message: "Email inválido" }), {
        status: 400,
      });
    }

    const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;
    const BREVO_LIST_ID = import.meta.env.BREVO_LIST_ID;

    if (!BREVO_API_KEY || !BREVO_LIST_ID) {
      console.error("Brevo API Key or List ID not configured.");
      return new Response(
        JSON.stringify({ message: "Error de configuración del servidor" }),
        { status: 500 }
      );
    }

    const apiInstance = new ContactsApi();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiInstance as any).authentications.apiKey.apiKey = BREVO_API_KEY;

    const createContact = new CreateContact();
    createContact.email = email;
    createContact.listIds = [Number(BREVO_LIST_ID)];

    await apiInstance.createContact(createContact);

    return new Response(
      JSON.stringify({
        message: "¡Suscripción exitosa!",
        detail: "Tu correo ha sido registrado correctamente.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en suscripción de Brevo:", error);

    let detail = "Ocurrió un error inesperado.";
    if (error instanceof Error) {
      detail = error.message;
    }
    
    if (typeof error === 'object' && error !== null && 'body' in error) {
        const brevoError = error as { body?: unknown };
        if (brevoError.body) {
            detail = JSON.stringify(brevoError.body);
        }
    }

    return new Response(
      JSON.stringify({
        message: "Error al procesar la suscripción",
        detail,
      }),
      { status: 500 }
    );
  }
};
