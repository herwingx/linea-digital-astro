// src/lib/gemini-client.ts
/**
 * Cliente de Gemini AI para el chatbot
 * 
 * Maneja la comunicación con la API de Google Gemini
 * y procesa las respuestas del modelo de IA.
 */

import { GoogleGenerativeAI, type ChatSession } from "@google/generative-ai";
import { getSystemPrompt, detectIntent, findRelevantFAQs, type FAQ } from "./chatbot-knowledge.js";

// Tipos
export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  intent?: string[];
  relatedFAQs?: Array<{ pregunta: string; respuesta: string }>;
  error?: string;
}

// Configuración
const GEMINI_CONFIG = {
  model: "gemini-2.5-flash", // Modelo estable y compatible
  temperature: 0.7, // Balance entre creatividad y consistencia
  maxOutputTokens: 500, // Respuestas concisas
  topP: 0.9,
  topK: 40,
};

// Inicializar cliente
let genAI: GoogleGenerativeAI | null = null;

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
 * Obtiene una respuesta del chatbot usando Gemini AI
 */
export async function getChatbotResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Validación
    if (!userMessage || userMessage.trim().length === 0) {
      return {
        response: "Por favor escribe un mensaje para poder ayudarte. 😊",
        error: "empty_message"
      };
    }

    // Detectar intención
    const intents = detectIntent(userMessage);

    // Buscar FAQs relevantes
    const relevantFAQs = findRelevantFAQs(userMessage);

    // Inicializar cliente
    const client = getGeminiClient();

    // Configurar modelo con instrucciones del sistema
    const model = client.getGenerativeModel({
      model: GEMINI_CONFIG.model,
      systemInstruction: getSystemPrompt(),
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        topP: GEMINI_CONFIG.topP,
        topK: GEMINI_CONFIG.topK,
      },
    });

    // Construir historial de conversación
    // Filtrar para asegurar que el primer mensaje sea del usuario
    let filteredHistory = conversationHistory.filter((msg, index) => {
      // Excluir el mensaje de bienvenida del bot (primer mensaje)
      if (index === 0 && msg.role === 'bot') {
        return false;
      }
      return true;
    });

    // Asegurar que el historial comience con un mensaje del usuario
    if (filteredHistory.length > 0 && filteredHistory[0].role !== 'user') {
      filteredHistory = filteredHistory.slice(1);
    }

    const history = filteredHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Iniciar chat con historial
    const chat: ChatSession = model.startChat({
      history: history as any,
    });

    // Enviar mensaje y obtener respuesta
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    // Log para debugging (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('🤖 Chatbot Debug:', {
        userMessage,
        intents,
        relevantFAQs: relevantFAQs.length,
        responseLength: responseText.length
      });
    }

    return {
      response: responseText,
      intent: intents,
      relatedFAQs: relevantFAQs.map((faq: FAQ) => ({
        pregunta: faq.pregunta,
        respuesta: faq.respuesta
      }))
    };

  } catch (error: any) {
    console.error("❌ Error en Gemini API:", error);

    // Manejo de errores específicos
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

    // Error genérico
    return {
      response: "Lo siento, estoy teniendo problemas técnicos en este momento. 😔\n\nPor favor llama al:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10\n\nO visita nuestras sucursales para atención inmediata.",
      error: "unknown_error"
    };
  }
}

/**
 * Valida que la API key esté configurada correctamente
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
 * Genera una respuesta de fallback cuando la IA no está disponible
 */
export function getFallbackResponse(userMessage: string): ChatResponse {
  const intents = detectIntent(userMessage);
  const faqs = findRelevantFAQs(userMessage, 1);

  // Si encontramos una FAQ relevante, usarla
  if (faqs.length > 0) {
    return {
      response: `${faqs[0].respuesta}\n\n¿Necesitas ayuda con algo más? Llámanos al 961 618 92 00 (Tuxtla) o 962 625 58 10 (Tapachula). 📞`,
      intent: intents
    };
  }

  // Respuestas basadas en intención
  if (intents.includes('ubicacion')) {
    return {
      response: "🏢 **Nuestras Sucursales:**\n\n**Tuxtla:** 1a Av. Norte Poniente #834, Centro\n📞 961 618 92 00\n\n**Tapachula:** 4a. Av. Nte. 70, Los Naranjos\n📞 962 625 58 10\n\n⏰ Lun-Vie: 9:00 AM - 6:00 PM",
      intent: intents
    };
  }

  if (intents.includes('horario')) {
    return {
      response: "⏰ Nuestro horario es:\n**Lunes a Viernes: 9:00 AM - 6:00 PM**\n\nAmbas sucursales (Tuxtla y Tapachula)\n\n¿Te gustaría agendar una visita? Llama al 961 618 92 00 📞",
      intent: intents
    };
  }

  if (intents.includes('planes')) {
    return {
      response: "📱 Tenemos varios planes:\n\n• **Telcel Libre** (prepago) desde $100\n• **Telcel Ultra** (pospago) desde $299/mes\n• **Internet en Casa** desde $399/mes\n\nVisita lineadigital.com/personas para ver todos los detalles o llama al 961 618 92 00 para asesoría personalizada. 😊",
      intent: intents
    };
  }

  // Respuesta genérica
  return {
    response: "Gracias por contactarnos. Para una mejor atención, por favor llama a:\n\n📞 **Tuxtla:** 961 618 92 00\n📞 **Tapachula:** 962 625 58 10\n\nO visita lineadigital.com/contacto 😊",
    intent: intents
  };
}
