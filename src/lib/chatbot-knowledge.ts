// src/lib/chatbot-knowledge.ts

import { getAllChatbotKnowledge, type PromoEntry, type PlanEntry } from "../services/contentful.ts";

/**
 * Define la estructura de datos para una sucursal física.
 */
export interface Sucursal {
  /** El nombre descriptivo de la sucursal (ej. "Corporativo Tuxtla"). */
  nombre: string;
  /** La dirección completa de la sucursal. */
  direccion: string;
  /** El número de teléfono de contacto principal. */
  telefono: string;
  /** El horario de atención al público. */
  horario: string;
  /** La ciudad donde se encuentra la sucursal. */
  ciudad: string;
  /** El enlace directo de WhatsApp para contacto, si existe. */
  link_wa?: string;
}

/**
 * Define la estructura para una pregunta frecuente (FAQ).
 */
export interface FAQ {
  /** La pregunta tal como la haría un usuario. */
  pregunta: string;
  /** La respuesta concisa y directa a la pregunta. */
  respuesta: string;
  /** La categoría a la que pertenece la FAQ para una mejor clasificación. */
  categoria: 'ventas' | 'socios' | 'soporte' | 'cobertura';
}

/**
 * Contiene toda la información estática del chatbot, como datos de la empresa,
 * sucursales, preguntas frecuentes y palabras clave para la detección de intenciones.
 */
export const KNOWLEDGE_BASE = {
  empresa: {
    nombre: "Grupo Línea Digital",
    perfil: "Distribuidor Autorizado Premium Telcel en el Sureste.",
    slogan: "Conectamos tu mundo a la velocidad de 5G.",
    contacto_ventas: "961 618 92 00"
  },

  sucursales: [
    {
      nombre: "Corporativo Tuxtla",
      ciudad: "Tuxtla Gutiérrez",
      direccion: "1a Av. Norte Poniente #834, Centro.",
      telefono: "961 618 92 00",
      horario: "Lunes a Viernes: 9am - 6pm",
      link_wa: "https://wa.me/529616189200"
    },
    {
      nombre: "Sucursal Tapachula",
      ciudad: "Tapachula",
      direccion: "4a. Av. Nte. 70, Los Naranjos.",
      telefono: "962 625 58 10",
      horario: "Lunes a Viernes: 9am - 6pm",
      link_wa: "https://wa.me/529626255810"
    }
  ] as Sucursal[],

  faqs: [
    { pregunta: "¿Qué necesito para sacar un plan?", respuesta: "Solo tu INE vigente, comprobante de domicilio reciente y una tarjeta bancaria (crédito/débito).", categoria: "ventas" },
    { pregunta: "¿Venden al mayoreo?", respuesta: "Sí. Manejamos precios especiales a partir de 3 piezas para distribuidores registrados.", categoria: "socios" },
    { pregunta: "¿Cómo me vuelvo distribuidor?", respuesta: "Es gratis y rápido. Te damos de alta el mismo día para que vendas tiempo aire y chips.", categoria: "socios" },
    { pregunta: "¿Tienen cobertura en mi zona?", respuesta: "Cubrimos el 95% de Chiapas con red 4.5G y las principales ciudades con 5G.", categoria: "cobertura" }
  ] as FAQ[],

  intents: {
    comprar: ["comprar", "precio", "costo", "plan", "interesa", "iphone", "samsung", "quiero"],
    negocio: ["vender", "distribuidor", "mayoreo", "comisión", "socio", "proveedor"],
    soporte: ["ayuda", "falla", "no sirve", "garantía", "señal"],
    contacto: ["ubicación", "dónde están", "teléfono", "whatsapp"]
  }
};
/**
 * Construye el "prompt de sistema" para el modelo de IA.
 * Este método fusiona la personalidad estática y las reglas de negocio con
 * datos dinámicos (planes, promociones) obtenidos de Contentful en tiempo real.
 * @returns Una promesa que resuelve a un string con el prompt completo para la IA.
 */
export async function getSystemPrompt(): Promise<string> {
  const dynamicData = await getAllChatbotKnowledge().catch(err => {
    console.error("Error recuperando datos de Contentful:", err);
    return null;
  });

  let contentSection = "";
  let promosSection = "No hay promociones flash activas hoy.";
  let planesLibreSection = "";
  let planesUltraSection = "";
  let internetCasaSection = "";
  let empresarialSection = "";

  if (dynamicData) {
    if (dynamicData.promociones.length > 0) {
      const promosText = dynamicData.promociones.map((p: PromoEntry) => {
        const etiquetaLine = p.fields.etiqueta ? `Etiqueta: ${p.fields.etiqueta}` : '';
        const fechaLine = p.fields.fechaFin ? `Válido hasta: ${p.fields.fechaFin}` : '';
        return `
- **${p.fields.titulo}**: ${p.fields.descripcion}
  ${etiquetaLine}
  ${fechaLine}
`;
      }).join('\n');
      promosSection = `
# 🔥 PROMOCIONES ACTIVAS (PRIORIDAD ALTA)
${promosText}
`;
    }

    if (dynamicData.planes.personas.libre.length > 0) {
      planesLibreSection = dynamicData.planes.personas.libre.map((p: PlanEntry) => {
        let redesText = 'N/A';
        if (p.fields.redesSociales && Array.isArray(p.fields.redesSociales)) {
          const redesArray = p.fields.redesSociales.filter((r): r is string => typeof r === 'string');
          redesText = redesArray.length > 0 ? redesArray.join(', ') : 'N/A';
        }
        const recomendadoText = p.fields.recomendado ? '⭐ PLAN RECOMENDADO' : '';
        return `
- **${p.fields.titulo}**:
  Precio: $${p.fields.precio}
  Datos: ${p.fields.datosIncluidos}
  Minutos/SMS: ${p.fields.minutosYSmsIncluidos}
  Redes Sociales: ${redesText}
  ${recomendadoText}
`;
      }).join('\n');
    }

    if (dynamicData.planes.personas.ultra.length > 0) {
      planesUltraSection = dynamicData.planes.personas.ultra.map((p: PlanEntry) => {
        let redesText = 'Todas';
        if (p.fields.redesSociales && Array.isArray(p.fields.redesSociales)) {
          const redesArray = p.fields.redesSociales.filter((r): r is string => typeof r === 'string');
          redesText = redesArray.length > 0 ? redesArray.join(', ') : 'Todas';
        }
        return `- [Renta Mensual] *${p.fields.titulo}* x $${p.fields.precio}/mes: ${p.fields.datosIncluidos} Nacionales, ${p.fields.minutosYSmsIncluidos}. Redes Ilimitadas: ${redesText}.`;
      }).join('\n');
    }

    if (dynamicData.planes.personas.internetCasa.length > 0) {
      internetCasaSection = dynamicData.planes.personas.internetCasa.map((p: PlanEntry) =>
        `- [Internet Casa] *${p.fields.titulo}* x $${p.fields.precio}/mes: ${p.fields.datosIncluidos} velocidad. Política uso justo: ${p.fields.politicaDeUsoJusto || 'Estándar'}.`
      ).join('\n');
    }

    if (dynamicData.planes.empresas.ultra.length > 0) {
      empresarialSection = "Menciona que tenemos Planes Empresariales Deducibles y Soluciones IoT. Derivar con Asesor Corporativo.";
    }

    contentSection = `
    === INVENTARIO Y PRECIOS ACTUALIZADOS ===
    ${promosSection}

     LISTA DE PRECIOS (Usa estos datos exactos):
    ${planesLibreSection}
    ${planesUltraSection}
    ${internetCasaSection}
    ${empresarialSection}
    `;
  }

  return `
# IDENTIDAD
Eres **Lía**, la Asesora Digital de Grupo Línea Digital (Distribuidor Autorizado Telcel en Chiapas).
No eres un simple bot de respuestas; eres una **experta en telecomunicaciones** diseñada para encontrar la solución perfecta para cada cliente.

Tu personalidad es:
- 🌟 **Experta y Segura**: Conoces los planes y equipos al revés y al derecho.
- 🤝 **Empática y Consultiva**: Escuchas primero, recomiendas después. Haces preguntas clave.
- 🚀 **Dinámica y Resolutiva**: Tus respuestas van al grano, sin rodeos innecesarios.
- 😊 **Cálida y Humana**: Usas emojis estratégicamente para suavizar la conversación, pero mantienes el profesionalismo.

# TU OBJETIVO SUPREMO
Tu meta NO es solo informar. Tu meta es **AYUDAR AL CLIENTE A TOMAR UNA DECISIÓN** y moverlo al siguiente paso (WhatsApp o Visita).
Cada interacción es una oportunidad de venta o fidelización.

${contentSection}

# ESTRATEGIA DE CONVERSACIÓN (MÉTODO L.I.A.)

## 1. L - LEER Y ESCUCHAR (Diagnóstico)
Antes de soltar precios, entiende el contexto.
- Si piden "un plan": Pregunta "¿Qué uso le das? ¿Redes sociales, trabajo, videos?" o "¿Cuál es tu presupuesto aproximado?"
- Si piden "internet": Pregunta "¿Es para casa o negocio? ¿Cuántas personas se conectarán?"
- Si piden "un celular": Pregunta "¿Buscas alguna marca en especial o prefieres que te recomiende uno por presupuesto?"

## 2. I - INFORMAR CON VALOR (Solución)
No des listas aburridas. Vende beneficios.
- ❌ "El plan cuesta $499 y tiene 10GB."
- ✅ "Te recomiendo el **Telcel Ultra 500** ($499/mes). Es ideal para ti porque te da **10GB de navegación libre** y **Redes Sociales ILIMITADAS**, así no te preocupas por consumir tus datos en Instagram o TikTok."

Usa los datos de la sección "LISTA DE PRECIOS" de arriba. **NO INVENTES PRECIOS.** Si no está en la lista, di que consultarás con un asesor humano.

## 3. A - ACCIONAR (Cierre)
Nunca dejes la conversación en un punto muerto. Siempre propón el siguiente paso.
- "¿Te gustaría que te ayude a contratarlo ahora mismo por WhatsApp?"
- "¿Prefieres pasar a nuestra sucursal en Tuxtla o Tapachula para verlo en persona?"
- "¿Te envío la ubicación exacta para que vengas por tu chip?"

# MANEJO DE SITUACIONES ESPECÍFICAS

### 💰 Cliente sensible al precio ("Está caro")
- Valida: "Entiendo perfectamente."
- Re-enfoca: "Recuerda que este plan incluye X y Y, lo que te ahorra tener que hacer recargas extra."
- Ofrece alternativa: "Si prefieres algo más económico, el plan de $X también es excelente opción."

### 🏢 Cliente Empresarial / Distribuidor
- Detecta palabras clave: "negocio", "vender", "mayoreo", "factura", "flotilla".
- Cambia a tono B2B (más formal, enfocado en rentabilidad y deducción de impuestos).
- **ACCIÓN CLAVE**: Deriva INMEDIATAMENTE al contacto corporativo o WhatsApp. "Para empresas manejamos cotizaciones a medida. Permíteme conectarte con un ejecutivo corporativo aquí: [Link WA]"

### 🔧 Soporte Técnico / Quejas
- Empatía total: "Lamento mucho que tengas ese inconveniente."
- No prometas soluciones técnicas que no puedes dar.
- **ACCIÓN CLAVE**: "Para solucionarlo rápido, lo mejor es que nuestro equipo técnico lo revise. ¿Puedes llevar tu equipo a nuestra sucursal en [Ciudad]?"

# REGLAS DE FORMATO
1. Usa **negritas** para resaltar: Precios, Nombres de Planes, Beneficios Clave.
2. Usa listas (✅, 📱, 🚀) para hacer la lectura fácil.
3. Mantén los párrafos cortos.
4. Si la respuesta es larga, divídela visualmente.

# DATOS DE CONTACTO (ÚSALOS SIEMPRE)
📍 **Tuxtla Gutiérrez**: 1a Av. Norte Poniente #834, Centro.
📍 **Tapachula**: 4a. Av. Nte. 70, Los Naranjos.
📞 Teléfono General: 961 618 92 00
⏰ Horario: Lunes a Viernes, 9:00 AM - 6:00 PM

# EJEMPLO DE FLUJO IDEAL
Usuario: "Quiero un iphone"
Lía: "¡Excelente elección! 📱 Los iPhone vuelan.
Para decirte cuáles tenemos disponibles hoy y sus precios exactos, ¿buscas algún modelo en específico (como el 15 o 16) o quieres ver las promociones vigentes?

También te comento que tenemos facilidades de pago con tarjeta de crédito. 💳"
Usuario: "El 15 pro"
Lía: "¡Uff, una joya! 💎 El **iPhone 15 Pro** tiene una cámara espectacular.
Lo tenemos disponible. Puedes llevártelo en **Amigo Kit** (prepago) o en un **Plan Telcel Plus** (donde el equipo te sale más barato al contratar el servicio).

¿Te gustaría que te cotice cómo quedarían las mensualidades en un plan?"

---
¡Ahora ve y sorprende a esos clientes, Lía! 🚀
`;
}

// --- HELPERS ---

/**
 * Detecta la intención principal de un mensaje del usuario basándose en palabras clave.
 * @param message El mensaje del usuario.
 * @returns Un array de strings con las intenciones detectadas (ej. ['comprar', 'contacto']).
 */
export function detectIntent(message: string): string[] {
  const lower = message.toLowerCase();
  const intents: string[] = [];
  for (const [key, keywords] of Object.entries(KNOWLEDGE_BASE.intents)) {
    if (keywords.some(k => lower.includes(k))) intents.push(key);
  }
  return intents;
}

/**
 * Detecta el sentimiento general de un mensaje del usuario.
 * @param message El mensaje del usuario.
 * @returns Una categoría de sentimiento: 'positive', 'negative', 'neutral', o 'urgent'.
 */
export function detectSentiment(message: string): 'positive' | 'negative' | 'neutral' | 'urgent' {
  const lower = message.toLowerCase();
  
  const urgentKeywords = ['urgente', 'rápido', 'ya', 'ahora', 'ayuda', 'problema', 'no funciona', 'falla'];
  if (urgentKeywords.some(k => lower.includes(k))) return 'urgent';
  
  const negativeKeywords = ['malo', 'caro', 'no sirve', 'molesto', 'enojado', 'pésimo', 'horrible'];
  if (negativeKeywords.some(k => lower.includes(k))) return 'negative';
  
  const positiveKeywords = ['gracias', 'excelente', 'perfecto', 'genial', 'bueno', 'me gusta', 'interesa'];
  if (positiveKeywords.some(k => lower.includes(k))) return 'positive';
  
  return 'neutral';
}

/**
 * Detecta si un mensaje contiene señales de una intención de compra inminente.
 * @param message El mensaje del usuario.
 * @returns `true` si se detecta una señal de compra, de lo contrario `false`.
 */
export function detectBuyingIntent(message: string): boolean {
  const lower = message.toLowerCase();
  const buyingSignals = [
    'quiero', 'comprar', 'contratar', 'me interesa', 'cómo lo consigo',
    'dónde lo compro', 'cuándo puedo', 'disponible', 'en stock',
    'lo quiero', 'me lo llevo', 'sí', 'ok', 'dale', 'va'
  ];
  return buyingSignals.some(signal => lower.includes(signal));
}

/**
 * Genera una lista de respuestas rápidas sugeridas basadas en la intención detectada.
 * @param intent Un array de intenciones detectadas en el mensaje del usuario.
 * @returns Un array de strings con las respuestas rápidas sugeridas.
 */
export function generateQuickReplies(intent: string[]): string[] {
  const replies: string[] = [];
  
  if (intent.includes('comprar')) {
    replies.push('Ver planes móviles', 'Ver internet casa', 'Hablar con asesor');
  } else if (intent.includes('negocio')) {
    replies.push('Requisitos distribuidor', 'Comisiones', 'Contactar asesor B2B');
  } else if (intent.includes('soporte')) {
    replies.push('Problemas de señal', 'Configurar APN', 'Agendar visita');
  } else if (intent.includes('contacto')) {
    replies.push('WhatsApp Tuxtla', 'WhatsApp Tapachula', 'Ver ubicaciones');
  } else {
    replies.push('Ver planes', 'Ubicaciones', 'Hablar con asesor');
  }
  
  return replies;
}

/**
 * Obtiene el enlace de WhatsApp correspondiente a una ciudad mencionada en el mensaje.
 * @param message El mensaje del usuario.
 * @returns El enlace de WhatsApp de la sucursal correspondiente, o el de Tuxtla por defecto.
 */
export function getWhatsAppLink(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('tapachula') || lower.includes('frontera') || lower.includes('soconusco')) {
    return KNOWLEDGE_BASE.sucursales[1].link_wa || '';
  }
  
  return KNOWLEDGE_BASE.sucursales[0].link_wa || '';
}

/**
 * Formatea los detalles de un plan en un string atractivo y legible para el chat.
 * @param plan Un objeto con los detalles del plan a formatear.
 * @returns Un string formateado con los detalles del plan.
 */
export function formatPlanForChat(plan: {
  titulo: string;
  precio: number;
  datosIncluidos: string;
  minutosYSmsIncluidos: string;
  redesSociales?: string[];
  recomendado?: boolean;
}): string {
  const redes = plan.redesSociales && Array.isArray(plan.redesSociales) 
    ? plan.redesSociales.filter((r): r is string => typeof r === 'string').join(', ')
    : 'Incluidas';
  
  const badge = plan.recomendado ? '⭐ ' : '';
  
  return `${badge}**${plan.titulo}** - $${plan.precio}/mes
✅ ${plan.datosIncluidos}
✅ ${plan.minutosYSmsIncluidos}
✅ Redes: ${redes}`;
}

/**
 * Genera un saludo contextual (Buenos días, Buenas tardes, Buenas noches) basado en la hora actual.
 * @returns Un string con el saludo apropiado.
 */
export function getContextualGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return '¡Buenos días! ☀️';
  } else if (hour >= 12 && hour < 19) {
    return '¡Buenas tardes! 👋';
  } else {
    return '¡Buenas noches! 🌙';
  }
}