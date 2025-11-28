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

    // Strategy: Try to create first, if duplicate then check if already in list or update
    try {
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
    } catch (createError: unknown) {
      // Check if it's a duplicate error
      const isDuplicateError =
        typeof createError === 'object' &&
        createError !== null &&
        'response' in createError &&
        typeof (createError as { response?: { data?: { code?: string } } }).response === 'object' &&
        (createError as { response?: { data?: { code?: string } } }).response?.data?.code === 'duplicate_parameter';

      if (isDuplicateError) {
        // Contact exists, check if already in this list
        try {
          const existingContact = await apiInstance.getContactInfo(email);

          // Check if already in the target list
          if (existingContact.body.listIds?.includes(Number(BREVO_LIST_ID))) {
            return new Response(
              JSON.stringify({
                message: "Ya estás suscrito",
                detail: "Este correo ya está registrado en nuestra lista de suscriptores.",
              }),
              { status: 200 }
            );
          }

          // Not in this list, add them
          const currentLists = existingContact.body.listIds || [];
          const updatedLists = [...currentLists, Number(BREVO_LIST_ID)];

          await apiInstance.updateContact(email, {
            listIds: updatedLists
          });

          return new Response(
            JSON.stringify({
              message: "¡Suscripción exitosa!",
              detail: "Tu correo ha sido registrado correctamente.",
            }),
            { status: 200 }
          );
        } catch (getError) {
          console.error('❌ Error al obtener info del contacto:', getError);
          throw getError;
        }
      }

      // If it's not a duplicate error, throw it
      console.error('❌ Error no manejado al crear contacto:', createError);
      throw createError;
    }
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
