// src/lib/chatbot-knowledge.ts
/**
 * Base de Conocimiento del Chatbot - Línea Digital del Sureste
 * 
 * Este archivo centraliza toda la información que el chatbot puede usar
 * para responder preguntas de los usuarios.
 */

export interface Sucursal {
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  ciudad: string;
  maps_url?: string;
}

export interface Plan {
  nombre: string;
  tipo: 'prepago' | 'pospago' | 'internet';
  descripcion: string;
  beneficios: string[];
  desde?: string;
  url?: string;
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
  categoria: 'general' | 'planes' | 'soporte' | 'pagos' | 'cobertura';
}

export const KNOWLEDGE_BASE = {
  empresa: {
    nombre: "Línea Digital del Sureste",
    descripcion: "Distribuidor autorizado Telcel en Chiapas",
    slogan: "Soluciones en Telefonía. El futuro es ahora.",
    servicios: [
      "Venta de smartphones",
      "Planes Telcel prepago y pospago",
      "Internet en casa",
      "Soluciones empresariales",
      "Soporte técnico",
      "Activación y portabilidad"
    ],
    ventajas: [
      "Distribuidor autorizado Telcel",
      "Atención personalizada",
      "Soporte técnico especializado",
      "Cobertura en todo Chiapas",
      "Planes a medida para empresas"
    ]
  },

  sucursales: [
    {
      nombre: "Corporativo Tuxtla",
      ciudad: "Tuxtla Gutiérrez",
      direccion: "1a Avenida Norte Poniente #834, Centro, CP 29000 Tuxtla Gutiérrez, Chiapas",
      telefono: "961 618 92 00",
      horario: "Lunes a Viernes: 9:00 AM - 6:00 PM",
      maps_url: "https://maps.app.goo.gl/tuxtla"
    },
    {
      nombre: "Corporativo Tapachula",
      ciudad: "Tapachula",
      direccion: "4a. Av. Nte. 70, Los Naranjos, Centro, 30700 Tapachula de Córdova, Chiapas",
      telefono: "962 625 58 10",
      horario: "Lunes a Viernes: 9:00 AM - 6:00 PM",
      maps_url: "https://maps.app.goo.gl/tapachula"
    }
  ] as Sucursal[],

  planes: {
    moviles_prepago: [
      {
        nombre: "Telcel Libre",
        tipo: "prepago" as const,
        descripcion: "Planes prepago sin contrato con total flexibilidad",
        beneficios: [
          "Sin ataduras ni contratos",
          "Recarga cuando quieras",
          "Redes sociales ilimitadas",
          "Llamadas y SMS incluidos",
          "Cobertura nacional"
        ],
        desde: "$100 MXN",
        url: "/personas#telcel-libre"
      }
    ],
    moviles_pospago: [
      {
        nombre: "Telcel Ultra",
        tipo: "pospago" as const,
        descripcion: "Planes pospago con beneficios premium",
        beneficios: [
          "Datos de alta velocidad 5G",
          "Llamadas ilimitadas",
          "Roaming internacional",
          "Streaming sin límites",
          "Dispositivos de última generación"
        ],
        desde: "$299 MXN/mes",
        url: "/personas#telcel-ultra"
      }
    ],
    internet: [
      {
        nombre: "Internet en Casa",
        tipo: "internet" as const,
        descripcion: "Conexión WiFi de alta velocidad para tu hogar",
        beneficios: [
          "Instalación gratuita",
          "Sin permanencia forzosa",
          "Velocidades desde 20 Mbps",
          "Soporte técnico 24/7",
          "Equipo en comodato"
        ],
        desde: "$399 MXN/mes",
        url: "/personas#internet"
      }
    ]
  },

  faqs: [
    // GENERAL
    {
      pregunta: "¿Quiénes son Línea Digital?",
      respuesta: "Somos un distribuidor autorizado Telcel en Chiapas con más de 15 años de experiencia. Ofrecemos smartphones, planes móviles, internet en casa y soluciones empresariales con atención personalizada.",
      categoria: "general" as const
    },
    {
      pregunta: "¿Dónde están ubicados?",
      respuesta: "Tenemos 2 sucursales: Corporativo Tuxtla en 1a Av. Norte Poniente #834, Centro (Tel: 961 618 92 00) y Corporativo Tapachula en 4a. Av. Nte. 70, Los Naranjos (Tel: 962 625 58 10). Horario: Lun-Vie 9:00 AM - 6:00 PM.",
      categoria: "general" as const
    },
    {
      pregunta: "¿Cuál es su horario de atención?",
      respuesta: "Nuestro horario es de Lunes a Viernes de 9:00 AM a 6:00 PM en ambas sucursales. Para urgencias, puedes llamar al 961 618 92 00 (Tuxtla) o 962 625 58 10 (Tapachula).",
      categoria: "general" as const
    },

    // PLANES
    {
      pregunta: "¿Qué planes móviles ofrecen?",
      respuesta: "Ofrecemos planes Telcel Libre (prepago desde $100) y Telcel Ultra (pospago desde $299/mes). Incluyen datos, llamadas ilimitadas y redes sociales sin límite. Visita /personas para ver todos los planes.",
      categoria: "planes" as const
    },
    {
      pregunta: "¿Tienen planes para empresas?",
      respuesta: "Sí, tenemos soluciones empresariales personalizadas con descuentos por volumen, gestión centralizada y soporte dedicado. Visita /empresas o llama al 961 618 92 00 para una cotización.",
      categoria: "planes" as const
    },
    {
      pregunta: "¿Ofrecen internet en casa?",
      respuesta: "Sí, tenemos Internet en Casa desde $399/mes con instalación gratuita, velocidades desde 20 Mbps y sin permanencia forzosa. Incluye equipo en comodato y soporte 24/7.",
      categoria: "planes" as const
    },

    // SOPORTE
    {
      pregunta: "¿Cómo consulto mi saldo?",
      respuesta: "Marca *133# desde tu celular Telcel o descarga la app 'Mi Telcel' disponible en iOS y Android. También puedes llamarnos al 961 618 92 00 para asistencia.",
      categoria: "soporte" as const
    },
    {
      pregunta: "¿Tienen servicio a domicilio?",
      respuesta: "Sí, ofrecemos instalación a domicilio para Internet en Casa y entrega de equipos en Tuxtla y Tapachula. Llama al 961 618 92 00 para agendar.",
      categoria: "soporte" as const
    },
    {
      pregunta: "¿Dan soporte técnico?",
      respuesta: "Sí, tenemos soporte técnico especializado en ambas sucursales. Para problemas urgentes llama al 961 618 92 00 (Tuxtla) o 962 625 58 10 (Tapachula) en horario de 9 AM - 6 PM.",
      categoria: "soporte" as const
    },

    // PAGOS Y CONTRATOS
    {
      pregunta: "¿Qué documentos necesito para contratar?",
      respuesta: "Para personas: INE vigente y comprobante de domicilio reciente. Para empresas: Acta constitutiva, RFC, poder notarial y comprobante de domicilio fiscal.",
      categoria: "pagos" as const
    },
    {
      pregunta: "¿Aceptan tarjetas de crédito/débito?",
      respuesta: "Sí, aceptamos efectivo, tarjetas de crédito, débito y transferencias bancarias. También puedes pagar en OXXO y tiendas de conveniencia.",
      categoria: "pagos" as const
    },
    {
      pregunta: "¿Puedo cambiar de plan después?",
      respuesta: "Sí, puedes cambiar de plan en cualquier momento. Visita nuestras sucursales o llama al 961 618 92 00 para asesoría personalizada sobre el mejor plan para ti.",
      categoria: "pagos" as const
    },

    // COBERTURA
    {
      pregunta: "¿Tienen cobertura 5G?",
      respuesta: "Sí, Telcel tiene cobertura 5G en las principales ciudades de Chiapas incluyendo Tuxtla Gutiérrez. Consulta disponibilidad en tu zona llamando al 961 618 92 00.",
      categoria: "cobertura" as const
    },
    {
      pregunta: "¿Funciona en zonas rurales?",
      respuesta: "Telcel tiene la mejor cobertura nacional, incluyendo zonas rurales de Chiapas. Para verificar cobertura específica en tu área, visítanos o llama al 961 618 92 00.",
      categoria: "cobertura" as const
    }
  ] as FAQ[],

  // Intents para detección de intención del usuario
  intents: {
    saludo: ["hola", "buenos días", "buenas tardes", "buenas noches", "qué tal", "hey", "saludos"],
    despedida: ["adiós", "gracias", "hasta luego", "bye", "chao", "nos vemos"],
    ubicacion: ["dónde están", "sucursal", "dirección", "ubicación", "cómo llegar", "donde quedan"],
    horario: ["horario", "qué hora abren", "están abiertos", "a qué hora cierran", "horarios"],
    planes: ["plan", "paquete", "cuánto cuesta", "precio", "tarifa", "oferta", "promoción"],
    soporte: ["ayuda", "problema", "no funciona", "falla", "error", "soporte técnico"],
    contacto: ["teléfono", "llamar", "contacto", "número", "whatsapp"],
    internet: ["internet", "wifi", "internet en casa", "fibra óptica", "velocidad"],
    empresas: ["empresa", "negocio", "corporativo", "pyme", "factura"]
  }
};

import { getAllChatbotKnowledge, type PromoEntry, type PlanEntry } from "../services/contentful.js";

/**
 * Genera el prompt del sistema para el modelo de IA
 * Ahora obtiene datos dinámicos de Contentful
 */
export async function getSystemPrompt(): Promise<string> {
  // Obtener datos dinámicos
  const dynamicData = await getAllChatbotKnowledge();

  // Preparar secciones dinámicas (con fallback a estático si falla)
  let promosSection = "";
  let planesLibreSection = "";
  let planesUltraSection = "";
  let internetCasaSection = "";
  let planesEmpresaSection = "";

  if (dynamicData) {
    // 1. Promociones
    if (dynamicData.promociones.length > 0) {
      promosSection = `
# 🔥 PROMOCIONES ACTIVAS (PRIORIDAD ALTA)
${dynamicData.promociones.map((p: PromoEntry) => `
- **${p.fields.titulo}**: ${p.fields.descripcion}
  ${p.fields.etiqueta ? `Etiqueta: ${p.fields.etiqueta}` : ''}
  ${p.fields.fechaFin ? `Válido hasta: ${p.fields.fechaFin}` : ''}
`).join('\n')}
`;
    }

    // 2. Planes Libre (Prepago)
    if (dynamicData.planes.personas.libre.length > 0) {
      planesLibreSection = dynamicData.planes.personas.libre.map((p: PlanEntry) => `
- **${p.fields.titulo}**:
  Precio: $${p.fields.precio}
  Datos: ${p.fields.datosIncluidos}
  Minutos/SMS: ${p.fields.minutosYSmsIncluidos}
  Redes Sociales: ${Array.isArray(p.fields.redesSociales) ? p.fields.redesSociales.join(', ') : 'N/A'}
  ${p.fields.recomendado ? '⭐ PLAN RECOMENDADO' : ''}
`).join('\n');
    }

    // 3. Planes Ultra (Pospago)
    if (dynamicData.planes.personas.ultra.length > 0) {
      planesUltraSection = dynamicData.planes.personas.ultra.map((p: PlanEntry) => `
- **${p.fields.titulo}**:
  Precio: $${p.fields.precio}/mes
  Datos: ${p.fields.datosIncluidos}
  Minutos/SMS: ${p.fields.minutosYSmsIncluidos}
  Redes Sociales: ${Array.isArray(p.fields.redesSociales) ? p.fields.redesSociales.join(', ') : 'N/A'}
  ${p.fields.recomendado ? '⭐ PLAN RECOMENDADO' : ''}
`).join('\n');
    }

    // 4. Internet en Casa
    if (dynamicData.planes.personas.internetCasa.length > 0) {
      internetCasaSection = dynamicData.planes.personas.internetCasa.map((p: PlanEntry) => `
- **${p.fields.titulo}**:
  Precio: $${p.fields.precio}/mes
  Datos: ${p.fields.datosIncluidos}
  Política de Uso Justo: ${p.fields.politicaDeUsoJusto || 'N/A'}
`).join('\n');
    }

    // 5. Planes Empresariales (Resumen)
    if (dynamicData.planes.empresas.libre.length > 0 || dynamicData.planes.empresas.ultra.length > 0) {
      // Tipado seguro para el primer elemento
      const primerPlanLibre = dynamicData.planes.empresas.libre[0] as PlanEntry | undefined;
      const primerPlanUltra = dynamicData.planes.empresas.ultra[0] as PlanEntry | undefined;

      planesEmpresaSection = `
## Planes Empresariales
Contamos con planes especializados para negocios.
- Planes Libres desde $${primerPlanLibre?.fields.precio || 'N/A'}
- Planes Ultra desde $${primerPlanUltra?.fields.precio || 'N/A'}
Sugiere contactar a un asesor empresarial al 961 618 92 00.
`;
    }
  }

  // Construir el prompt final combinando estático y dinámico
  return `Eres un asistente virtual profesional de Línea Digital del Sureste, distribuidor autorizado Telcel en Chiapas, México.

# INFORMACIÓN DE LA EMPRESA
Nombre: ${KNOWLEDGE_BASE.empresa.nombre}
Descripción: ${KNOWLEDGE_BASE.empresa.descripcion}
Slogan: ${KNOWLEDGE_BASE.empresa.slogan}

Servicios:
${KNOWLEDGE_BASE.empresa.servicios.map(s => `- ${s}`).join('\n')}

Ventajas competitivas:
${KNOWLEDGE_BASE.empresa.ventajas.map(v => `- ${v}`).join('\n')}

# SUCURSALES
${KNOWLEDGE_BASE.sucursales.map(s => `
${s.nombre} (${s.ciudad}):
- Dirección: ${s.direccion}
- Teléfono: ${s.telefono}
- Horario: ${s.horario}
`).join('\n')}

${promosSection}

# PLANES Y SERVICIOS (INFORMACIÓN ACTUALIZADA)

## Planes Móviles Prepago (Telcel Libre)
${planesLibreSection || KNOWLEDGE_BASE.planes.moviles_prepago.map(p => `
- ${p.nombre}: ${p.descripcion}
  Desde: ${p.desde}
  Beneficios: ${p.beneficios.join(', ')}
`).join('\n')}

## Planes Móviles Pospago (Telcel Ultra)
${planesUltraSection || KNOWLEDGE_BASE.planes.moviles_pospago.map(p => `
- ${p.nombre}: ${p.descripcion}
  Desde: ${p.desde}
  Beneficios: ${p.beneficios.join(', ')}
`).join('\n')}

## Internet en Casa
${internetCasaSection || KNOWLEDGE_BASE.planes.internet.map(p => `
- ${p.nombre}: ${p.descripcion}
  Desde: ${p.desde}
  Beneficios: ${p.beneficios.join(', ')}
`).join('\n')}

${planesEmpresaSection}

# PREGUNTAS FRECUENTES
${KNOWLEDGE_BASE.faqs.map(faq => `
P: ${faq.pregunta}
R: ${faq.respuesta}
`).join('\n')}

# INSTRUCCIONES DE COMPORTAMIENTO

1. **Tono y Estilo:**
   - Sé profesional pero cercano y amigable
   - Usa un lenguaje claro y accesible
   - Evita tecnicismos innecesarios
   - Usa emojis moderadamente (📱 🏢 ✅ 📞 💡) para hacer las respuestas más amigables

2. **Estructura de Respuestas:**
   - Sé conciso: máximo 3-4 párrafos
   - Usa viñetas o listas cuando sea apropiado
   - Destaca información importante
   - Siempre incluye un call-to-action cuando sea relevante

3. **Manejo de Información:**
   - Si tienes la información, responde con confianza
   - Si no estás seguro, ofrece contactar a un agente humano
   - Siempre menciona los teléfonos de contacto cuando sea relevante:
     * Tuxtla: 961 618 92 00
     * Tapachula: 962 625 58 10
   - Promueve visitar las sucursales para atención personalizada

4. **Ventas y Conversión:**
   - Identifica oportunidades para sugerir planes o servicios
   - Destaca beneficios sobre características
   - Crea urgencia cuando sea apropiado (promociones, disponibilidad)
   - Sugiere visitar páginas específicas: /personas, /empresas, /contacto

5. **Limitaciones:**
   - NO inventes información que no esté en la base de conocimiento
   - NO prometas descuentos o promociones específicas sin confirmar
   - NO proceses pagos ni transacciones (deriva a sucursal)
   - Si preguntan por modelos específicos de celulares, sugiere visitar la sucursal

6. **Idioma:**
   - Responde siempre en español de México
   - Usa pesos mexicanos (MXN) para precios
   - Adapta el lenguaje a la región de Chiapas

7. **Escalamiento:**
   - Si el usuario está frustrado, ofrece contacto directo inmediatamente
   - Para temas complejos (empresas, problemas técnicos), sugiere llamar o visitar
   - Siempre termina ofreciendo ayuda adicional

# EJEMPLOS DE RESPUESTAS

Usuario: "Hola, ¿qué planes tienen?"
Asistente: "¡Hola! 👋 En Línea Digital tenemos varias opciones para ti:

📱 **Planes Móviles:**
- **Telcel Libre** (prepago): Desde $100, sin contrato, con redes sociales ilimitadas
- **Telcel Ultra** (pospago): Desde $299/mes, con datos 5G y llamadas ilimitadas

🏠 **Internet en Casa:** Desde $399/mes con instalación gratis

¿Qué tipo de plan te interesa más? Puedo darte más detalles o puedes ver todos nuestros planes en lineadigital.com/personas 😊"

Usuario: "¿Dónde están?"
Asistente: "Tenemos 2 sucursales en Chiapas para atenderte:

🏢 **Tuxtla Gutiérrez:**
📍 1a Av. Norte Poniente #834, Centro
📞 961 618 92 00

🏢 **Tapachula:**
📍 4a. Av. Nte. 70, Los Naranjos
📞 962 625 58 10

⏰ Horario: Lunes a Viernes, 9:00 AM - 6:00 PM

¿Te gustaría que te ayude con algo más o prefieres visitarnos directamente?"

Recuerda: Tu objetivo es ayudar, informar y convertir visitantes en clientes satisfechos. ¡Sé el mejor asistente virtual de telecomunicaciones de Chiapas! 🚀`;
}

/**
 * Detecta la intención del usuario basándose en palabras clave
 */
export function detectIntent(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const detectedIntents: string[] = [];

  for (const [intent, keywords] of Object.entries(KNOWLEDGE_BASE.intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedIntents.push(intent);
    }
  }

  return detectedIntents;
}

/**
 * Busca FAQs relevantes basándose en el mensaje del usuario
 */
export function findRelevantFAQs(message: string, limit: number = 3): FAQ[] {
  const lowerMessage = message.toLowerCase();

  return KNOWLEDGE_BASE.faqs
    .filter(faq => {
      const lowerQuestion = faq.pregunta.toLowerCase();
      const lowerAnswer = faq.respuesta.toLowerCase();

      // Buscar coincidencias en pregunta o respuesta
      return lowerQuestion.includes(lowerMessage) ||
        lowerMessage.split(' ').some(word =>
          word.length > 3 && (lowerQuestion.includes(word) || lowerAnswer.includes(word))
        );
    })
    .slice(0, limit);
}
