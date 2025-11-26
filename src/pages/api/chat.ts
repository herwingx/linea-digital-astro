// src/pages/api/chat.ts
/**
 * API Endpoint para el Chatbot
 * 
 * Maneja las peticiones del cliente y se comunica con Gemini AI
 */

// IMPORTANTE: Deshabilitar prerendering para permitir requests dinámicos
export const prerender = false;

import type { APIRoute } from 'astro';
import { getChatbotResponse, getFallbackResponse, validateGeminiConfig } from '../../lib/gemini-client.js';
import type { ChatMessage } from '../../lib/gemini-client.js';

// Rate limiting simple (en producción usar Redis o similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests por ventana
const RATE_WINDOW = 60 * 1000; // 1 minuto

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

function getClientIP(request: Request): string {
  // Intentar obtener IP real (detrás de proxy/CDN)
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

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // 1. Validar Content-Type
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

    // 2. Rate Limiting
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

    // 3. Parsear body
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

    // 4. Validar mensaje
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

    // Validar longitud del mensaje
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

    // Validar historial
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

    // Limitar historial a últimos 10 mensajes para no exceder límites de tokens
    const limitedHistory = history.slice(-10);

    // 5. Validar configuración de Gemini
    const configValidation = validateGeminiConfig();
    if (!configValidation.valid) {
      console.error('❌ Configuración de Gemini inválida:', configValidation.message);

      // Usar respuesta de fallback
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

    // 6. Obtener respuesta de Gemini AI
    const chatResponse = await getChatbotResponse(message, limitedHistory);

    // 7. Logging (solo en desarrollo)
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

    // 8. Responder
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

    // Error 500 con fallback
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

// Endpoint de health check
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
