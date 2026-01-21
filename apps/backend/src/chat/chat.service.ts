import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { ContentfulService, PromoEntry, PlanEntry } from '../contentful/contentful.service';
import { KNOWLEDGE_BASE } from './chat.constants';

export interface ChatMessage {
  role: 'user' | 'model' | 'bot';
  content: string;
}

export interface ChatResponse {
  response: string;
  intent?: string[];
  error?: string;
  fallback?: boolean;
}

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(ChatService.name);
  private modelConfig = {
    model: "gemini-2.5-flash", // Stable model
    temperature: 0.7,
    maxOutputTokens: 1000,
    topP: 0.9,
    topK: 40,
  };

  constructor(
    private configService: ConfigService,
    private contentfulService: ContentfulService
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async getResponse(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    try {
      if (!message.trim()) {
        return { response: "Por favor escribe un mensaje.", intent: [] };
      }

      const intents = this.detectIntent(message);
      const systemInstruction = await this.getSystemPrompt();

      const model = this.genAI.getGenerativeModel({
        model: this.modelConfig.model,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: this.modelConfig.temperature,
          maxOutputTokens: this.modelConfig.maxOutputTokens,
          topP: this.modelConfig.topP,
          topK: this.modelConfig.topK,
        }
      });

      // Format history for Gemini SDK
      // The SDK expects { role: 'user' | 'model', parts: [{ text: string }] }
      // Incoming history is assumed to be [{ role: 'user'|'bot', content: string }]
      // 'bot' role should be mapped to 'model'
      // IMPORTANT: Gemini requires first message to be 'user', so we filter out leading bot messages
      let chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Remove leading 'model' messages (e.g., bot greeting)
      while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
        chatHistory.shift();
      }

      const chatSession: ChatSession = model.startChat({
        history: chatHistory as any,
      });

      const result = await chatSession.sendMessage(message);
      const responseText = result.response.text();

      return {
        response: responseText,
        intent: intents
      };

    } catch (error: any) {
      this.logger.error('Error generating response', error);
      return this.getFallbackResponse(message, error.message);
    }
  }

  private detectIntent(message: string): string[] {
    const lower = message.toLowerCase();
    const intents: string[] = [];
    for (const [key, keywords] of Object.entries(KNOWLEDGE_BASE.intents)) {
      if (keywords.some(k => lower.includes(k))) intents.push(key);
    }
    return intents;
  }

  private async getSystemPrompt(): Promise<string> {
    const dynamicData = await this.contentfulService.getAllChatbotKnowledge();

    let promosSection = "No hay promociones flash activas hoy.";
    let planesLibreSection = "No disponibles.";
    let planesUltraSection = "No disponibles.";
    let planesInternetMovilSection = "No disponibles.";
    let internetCasaSection = "No disponibles.";
    let planesEmpresaSection = "No disponibles.";
    let planesEmpresaUltraSection = "No disponibles.";
    let internetEmpresaSection = "No disponibles.";

    if (dynamicData) {
      // Promociones
      if (dynamicData.promociones.length > 0) {
        promosSection = dynamicData.promociones.map((p: any) =>
          `- **${p.fields.titulo}**: ${p.fields.descripcion}`
        ).join('\n');
      }

      // Planes Personas - Libre
      if (dynamicData.planes.personas.libre.length > 0) {
        planesLibreSection = dynamicData.planes.personas.libre.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.datosIncluidos} - ${p.fields.minutosYSmsIncluidos || 'Min/SMS ilimitados'}`
        ).join('\n');
      }

      // Planes Personas - Ultra
      if (dynamicData.planes.personas.ultra.length > 0) {
        planesUltraSection = dynamicData.planes.personas.ultra.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.datosIncluidos} - ${p.fields.minutosYSmsIncluidos || 'Min/SMS ilimitados'}`
        ).join('\n');
      }

      // Planes Internet Móvil
      if (dynamicData.planes.personas.internet.length > 0) {
        planesInternetMovilSection = dynamicData.planes.personas.internet.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.datosIncluidos}`
        ).join('\n');
      }

      // Internet en Casa
      if (dynamicData.planes.personas.internetCasa.length > 0) {
        internetCasaSection = dynamicData.planes.personas.internetCasa.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.velocidadDeNavegacion || p.fields.datosIncluidos}`
        ).join('\n');
      }

      // Planes Empresariales - Libre
      if (dynamicData.planes.empresas.libre.length > 0) {
        planesEmpresaSection = dynamicData.planes.empresas.libre.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.datosIncluidos}`
        ).join('\n');
      }

      // Planes Empresariales - Ultra
      if (dynamicData.planes.empresas.ultra.length > 0) {
        planesEmpresaUltraSection = dynamicData.planes.empresas.ultra.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.datosIncluidos}`
        ).join('\n');
      }

      // Internet Empresa
      if (dynamicData.planes.empresas.internet.length > 0 || dynamicData.planes.empresas.internetEmpresa.length > 0) {
        const allInternetEmpresa = [...dynamicData.planes.empresas.internet, ...dynamicData.planes.empresas.internetEmpresa];
        internetEmpresaSection = allInternetEmpresa.map((p: any) =>
          `- ${p.fields.titulo}: $${p.fields.precio}/mes - ${p.fields.velocidadDeNavegacion || p.fields.datosIncluidos}`
        ).join('\n');
      }
    }

    return `
# ROL
Eres Lía, asesora virtual de Línea Digital, Distribuidor Autorizado Telcel en Chiapas.
Tu objetivo es vender planes Telcel y resolver dudas de clientes.

# PROMOCIONES ACTIVAS
${promosSection}

# PLANES TELCEL LIBRE (Sin plazo forzoso - Personas)
${planesLibreSection}

# PLANES TELCEL ULTRA (Con plazo forzoso - Personas)
${planesUltraSection}

# INTERNET MÓVIL (Tablets/Hotspots)
${planesInternetMovilSection}

# INTERNET EN TU CASA (Hogar fijo inalámbrico)
${internetCasaSection}

# PLANES EMPRESARIALES LIBRE
${planesEmpresaSection}

# PLANES EMPRESARIALES ULTRA
${planesEmpresaUltraSection}

# INTERNET EMPRESARIAL
${internetEmpresaSection}

# REGLAS DE COMUNICACIÓN
- Responde corto, claro y amable (máximo 3 párrafos).
- Usa emojis para dar calidez 📱🏠💼
- Si preguntan por precios, da opciones concretas del catálogo.
- Si preguntan por Internet en Casa, ofrece los planes de la sección "INTERNET EN TU CASA".
- Si son empresas, ofrece planes empresariales.
- Siempre intenta cerrar la venta o invitar a visitar sucursal.
- Si piden hablar con humano: Tuxtla 961 618 92 00, Tapachula 962 625 20 00.
- Si no sabes algo, di que pueden llamar para más info.
    `;
  }

  private getFallbackResponse(userMessage: string, error?: string): ChatResponse {
    const intents = this.detectIntent(userMessage);

    if (intents.includes('contacto')) {
      return {
        response: "Nuestras sucursales están en Tuxtla y Tapachula. Llámanos al 961 618 92 00. 📞",
        intent: intents,
        fallback: true
      };
    }
    return {
      response: "Lo siento, tengo problemas de conexión. Por favor llámanos al 961 618 92 00 para atención inmediata. 📞",
      intent: intents,
      fallback: true
    };
  }
}
