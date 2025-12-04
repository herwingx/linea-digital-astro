// src/lib/gemini-client.ts
/**
 * Este módulo gestiona la comunicación con la API de Google Gemini,
 * incluyendo la construcción de prompts, el manejo del historial
 * y el procesamiento de las respuestas del modelo de IA.
 */

import { GoogleGenerativeAI, type ChatSession } from "@google/generative-ai";
import { getSystemPrompt, detectIntent } from "./chatbot-knowledge.js";

/**
 * Representa un mensaje en el historial de la conversación, compatible con la API de Gemini.
 */
export interface ChatMessage {
  /** El rol del autor del mensaje. */
  role: 'user' | 'bot';
  /** El contenido de texto del mensaje. */
  content: string;
  /** Marca de tiempo opcional del mensaje. */
  timestamp?: string;
}

/**
 * Define la estructura de la respuesta que devuelve el servicio de chat.
 */
export interface ChatResponse {
  /** El texto de la respuesta generada por el bot. */
  response: string;
  /** Un array de intenciones detectadas en el mensaje del usuario. */
  intent?: string[];
  /** Una lista opcional de FAQs relacionadas con la consulta. */
  relatedFAQs?: Array<{ pregunta: string; respuesta: string }>;
  /** Un código de error opcional si algo salió mal. */
  error?: string;
}

/**
 * Configuración para el modelo generativo de Gemini.
 */
const GEMINI_CONFIG = {
  /** El modelo específico de Gemini a utilizar. */
  model: "gemini-2.5-flash",
  /** Controla la aleatoriedad de la respuesta. Valores más altos son más creativos. */
  temperature: 0.7,
  /** El número máximo de tokens a generar en la respuesta. */
  maxOutputTokens: 1500,
  /** Parámetro de muestreo para controlar la diversidad. */
  topP: 0.9,
  /** Parámetro de muestreo para controlar la aleatoriedad. */
  topK: 40,
};

let genAI: GoogleGenerativeAI | null = null;

/**
 * Obtiene una instancia singleton del cliente de GoogleGenerativeAI.
 * La inicializa con la API key de las variables de entorno la primera vez que se llama.
 * @throws {Error} Si la variable de entorno GEMINI_API_KEY no está configurada.
 * @returns La instancia del cliente de GoogleGenerativeAI.
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno");
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

/**
 * Envía un mensaje del usuario y el historial de la conversación a la API de Gemini
 * para obtener una respuesta inteligente. Incluye manejo de errores y validación.
 * @param userMessage El mensaje actual enviado por el usuario.
 * @param conversationHistory Un array de mensajes anteriores en la conversación.
 * @returns Una promesa que resuelve a un objeto `ChatResponse` con la respuesta del bot.
 */
export async function getChatbotResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    if (!userMessage || userMessage.trim().length === 0) {
      return {
        response: "Por favor escribe un mensaje para poder ayudarte. 😊",
        error: "empty_message"
      };
    }

    const intents = detectIntent(userMessage);

    const client = getGeminiClient();

    const systemInstruction = await getSystemPrompt();

    const model = client.getGenerativeModel({
      model: GEMINI_CONFIG.model,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        topP: GEMINI_CONFIG.topP,
        topK: GEMINI_CONFIG.topK,
      },
    });

    let history: any[] = [];

    const firstUserIndex = conversationHistory.findIndex(msg => msg.role === 'user');

    if (firstUserIndex !== -1) {
      const validHistory = conversationHistory.slice(firstUserIndex);

      history = validHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    }

    const chat: ChatSession = model.startChat({
      history: history as any,
    });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    if (import.meta.env.DEV) {
      console.log('🤖 Chatbot Debug:', {
        userMessage,
        intents,
        responseLength: responseText.length
      });
    }

    return {
      response: responseText,
      intent: intents
    };

  } catch (error: any) {
    console.error("❌ Error en Gemini API:", error);

    if (error?.message?.includes('API key')) {
      return {
        response: "Lo siento, hay un problema de configuración. Por favor contacta a nuestro equipo al 961 618 92 00. 📞",
        error: "api_key_error"
      };
    }

    if (error?.message?.includes('quota')) {
      return {
        response: "Estamos experimentando alta demanda. Por favor intenta de nuevo en unos momentos o llama al 961 618 92 00 para atención inmediata. 📞",
        error: "quota_exceeded"
      };
    }

    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return {
        response: "Parece que hay un problema de conexión. Por favor intenta de nuevo o llama al 961 618 92 00. 📞",
        error: "network_error"
      };
    }

    return {
      response: "Lo siento, estoy teniendo problemas técnicos en este momento. 😔\n\nPor favor llama al:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10\n\nO visita nuestras sucursales para atención inmediata.",
      error: "unknown_error"
    };
  }
}

/**
 * Valida que la API key de Gemini esté correctamente configurada en las variables de entorno.
 * @returns Un objeto que indica si la configuración es válida y un mensaje descriptivo.
 */
export function validateGeminiConfig(): { valid: boolean; message: string } {
  const apiKey = import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      valid: false,
      message: "GEMINI_API_KEY no está configurada. Agrega tu API key en el archivo .env"
    };
  }

  if (apiKey.length < 20) {
    return {
      valid: false,
      message: "GEMINI_API_KEY parece inválida (muy corta)"
    };
  }

  return {
    valid: true,
    message: "Configuración válida"
  };
}

/**
 * Genera una respuesta de fallback predefinida cuando la IA no está disponible o falla.
 * Utiliza la detección de intenciones simple para dar una respuesta contextual básica.
 * @param userMessage El mensaje original del usuario.
 * @returns Un objeto `ChatResponse` con una respuesta predefinida.
 */
export function getFallbackResponse(userMessage: string): ChatResponse {
  const intents = detectIntent(userMessage);

  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.match(/^(hola|buenos días|buenas tardes|buenas noches|hey|qué tal)/)) {
    return {
      response: "¡Hola! 👋 Soy **Lía**, tu asesora digital de Línea Digital.\n\nEstoy aquí para ayudarte con:\n📱 Planes móviles\n🏠 Internet en casa\n📍 Ubicaciones\n💼 Soluciones empresariales\n\n¿Qué te interesa?",
      intent: ['saludo']
    };
  }

  if (intents.includes('contacto') || intents.includes('ubicacion')) {
    return {
      response: "🏢 **Nuestras Sucursales:**\n\n📍 **Tuxtla Gutiérrez**\n1a Av. Norte Poniente #834, Centro\n📞 961 618 92 00\n💬 WhatsApp: https://wa.me/529616189200\n\n📍 **Tapachula**\n4a. Av. Nte. 70, Los Naranjos\n📞 962 625 58 10\n💬 WhatsApp: https://wa.me/529626255810\n\n⏰ Lun-Vie: 9:00 AM - 6:00 PM\n\n¿Te gustaría que te contacte un asesor? 😊",
      intent: intents
    };
  }

  if (intents.includes('horario')) {
    return {
      response: "⏰ **Nuestro horario de atención:**\n\n**Lunes a Viernes**\n9:00 AM - 6:00 PM\n\n📍 Ambas sucursales (Tuxtla y Tapachula)\n\n¿Te gustaría agendar una visita? Llámanos:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10",
      intent: intents
    };
  }

  if (intents.includes('comprar') || intents.includes('planes')) {
    return {
      response: "📱 **Nuestros Planes:**\n\n💙 **Telcel Libre** (Prepago)\nDesde $100 - Sin contrato\n\n⭐ **Telcel Ultra** (Pospago)\nDesde $299/mes - Datos 5G\n\n🏠 **Internet en Casa**\nDesde $399/mes - Instalación gratis\n\n¿Cuál te interesa más? Para una asesoría personalizada:\n📞 961 618 92 00 (Tuxtla)\n📞 962 625 58 10 (Tapachula)\n\nO visita: lineadigital.com/personas 😊",
      intent: intents
    };
  }

  if (intents.includes('negocio')) {
    return {
      response: "💼 **Soluciones Empresariales**\n\nTenemos planes especiales para negocios:\n✅ Descuentos por volumen\n✅ Gestión centralizada\n✅ Soporte dedicado\n✅ Alta express el mismo día\n\nPara una cotización personalizada, contacta a nuestro equipo corporativo:\n📞 961 618 92 00\n\nO visita: lineadigital.com/empresas",
      intent: intents
    };
  }

  if (intents.includes('soporte')) {
    return {
      response: "🔧 **Soporte Técnico**\n\nEstoy aquí para ayudarte. ¿Qué problema tienes?\n\nPara asistencia inmediata:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10\n\n⏰ Lun-Vie: 9:00 AM - 6:00 PM\n\nTambién puedes visitarnos en nuestras sucursales con tu equipo. 😊",
      intent: intents
    };
  }

  return {
    response: "Gracias por contactarme. 😊\n\nPara ayudarte mejor, puedo informarte sobre:\n📱 Planes móviles\n🏠 Internet en casa\n📍 Ubicaciones y horarios\n💼 Soluciones empresariales\n\n¿Qué te interesa?\n\nO si prefieres hablar con un asesor:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10",
    intent: intents
  };
}

