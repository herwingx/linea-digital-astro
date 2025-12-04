// src/pages/api/chat.ts
/**
 * API Endpoint para el Chatbot
 * 
 * Maneja las peticiones del cliente y se comunica con Gemini AI
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { getChatbotResponse, getFallbackResponse, validateGeminiConfig } from '../../lib/gemini-client.js';
import type { ChatMessage } from '../../lib/gemini-client.js';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

/**
 * Verifica si una dirección IP ha excedido el límite de peticiones.
 * Implementa un algoritmo de ventana deslizante simple en memoria.
 * @param ip La dirección IP del cliente.
 * @returns Un objeto que indica si la petición está permitida y cuántas peticiones restantes quedan.
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

/**
 * Obtiene la dirección IP real del cliente desde las cabeceras de la petición.
 * Considera proxies y CDNs al revisar 'x-forwarded-for' y 'x-real-ip'.
 * @param request El objeto de la petición (`Request`).
 * @returns La dirección IP del cliente o 'unknown' si no se puede determinar.
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Maneja las peticiones POST al endpoint del chat.
 * Valida la entrada, aplica rate limiting, se comunica con el servicio de Gemini
 * y devuelve una respuesta estructurada.
 */
export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'Content-Type debe ser application/json',
          fallback: 'Por favor llama al 961 618 92 00 para asistencia.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Demasiadas peticiones. Por favor espera un momento.',
          fallback: 'Para atención inmediata llama al 961 618 92 00 📞',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    let body: { message?: string; history?: ChatMessage[] };
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: 'JSON inválido',
          fallback: 'Por favor llama al 961 618 92 00 para asistencia.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'El campo "message" es requerido y debe ser un string',
          fallback: 'Por favor escribe un mensaje válido.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({
          error: 'El mensaje es demasiado largo (máximo 500 caracteres)',
          fallback: 'Por favor escribe un mensaje más corto o llama al 961 618 92 00.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!Array.isArray(history)) {
      return new Response(
        JSON.stringify({
          error: 'El campo "history" debe ser un array',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const limitedHistory = history.slice(-10);

    const configValidation = validateGeminiConfig();
    if (!configValidation.valid) {
      console.error('❌ Configuración de Gemini inválida:', configValidation.message);

      const fallbackResponse = getFallbackResponse(message);

      return new Response(
        JSON.stringify({
          response: fallbackResponse.response,
          intent: fallbackResponse.intent,
          fallbackMode: true,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Fallback-Mode': 'true'
          }
        }
      );
    }

    const chatResponse = await getChatbotResponse(message, limitedHistory);

    if (import.meta.env.DEV) {
      const duration = Date.now() - startTime;
      console.log('📊 Chat API Stats:', {
        ip: clientIP,
        messageLength: message.length,
        historyLength: limitedHistory.length,
        responseLength: chatResponse.response.length,
        duration: `${duration}ms`,
        hasError: !!chatResponse.error
      });
    }

    return new Response(
      JSON.stringify({
        response: chatResponse.response,
        intent: chatResponse.intent,
        relatedFAQs: chatResponse.relatedFAQs,
        timestamp: new Date().toISOString(),
        ...(chatResponse.error && { errorCode: chatResponse.error })
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Error crítico en API chat:', error);

    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        fallback: 'Lo sentimos, estamos experimentando problemas técnicos.\n\nPor favor contacta:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Maneja las peticiones GET a este endpoint, actuando como un health check.
 * Devuelve el estado del servicio y si la configuración de Gemini es válida.
 */
export const GET: APIRoute = async () => {
  const configValidation = validateGeminiConfig();

  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'chatbot-api',
      geminiConfigured: configValidation.valid,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
