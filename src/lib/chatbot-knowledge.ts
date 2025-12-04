// src/lib/chatbot-knowledge.ts

import { getAllChatbotKnowledge, type PromoEntry, type PlanEntry } from "../services/contentful.ts";

export interface Sucursal {
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  ciudad: string;
  link_wa?: string;
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
  categoria: 'ventas' | 'socios' | 'soporte' | 'cobertura';
}

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
    // Ventas B2C
    { pregunta: "¿Qué necesito para sacar un plan?", respuesta: "Solo tu INE vigente, comprobante de domicilio reciente y una tarjeta bancaria (crédito/débito).", categoria: "ventas" },
    // Ventas B2B
    { pregunta: "¿Venden al mayoreo?", respuesta: "Sí. Manejamos precios especiales a partir de 3 piezas para distribuidores registrados.", categoria: "socios" },
    { pregunta: "¿Cómo me vuelvo distribuidor?", respuesta: "Es gratis y rápido. Te damos de alta el mismo día para que vendas tiempo aire y chips.", categoria: "socios" },
    // Soporte
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
 * CONSTRUCTOR DEL SISTEMA DE IA
 * Integra datos vivos de Contentful para que el bot siempre tenga precios y stocks reales.
 */
export async function getSystemPrompt(): Promise<string> {
  // 1. Fetch de Contentful
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

  // 2. Procesamiento de Datos Dinámicos (Tu lógica original restaurada y formateada para IA)
  if (dynamicData) {

    // A. PROMOCIONES (Gancho de apertura)
    // 1. Promociones
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

    // 2. Planes Libre (Prepago)
    if (dynamicData.planes.personas.libre.length > 0) {
      planesLibreSection = dynamicData.planes.personas.libre.map((p: PlanEntry) => {
        // Type guard para redesSociales
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

    // C. PLANES ULTRA (Pospago - Producto Core)
    if (dynamicData.planes.personas.ultra.length > 0) {
      planesUltraSection = dynamicData.planes.personas.ultra.map((p: PlanEntry) => {
        // Type guard para redesSociales
        let redesText = 'Todas';
        if (p.fields.redesSociales && Array.isArray(p.fields.redesSociales)) {
          const redesArray = p.fields.redesSociales.filter((r): r is string => typeof r === 'string');
          redesText = redesArray.length > 0 ? redesArray.join(', ') : 'Todas';
        }
        return `- [Renta Mensual] *${p.fields.titulo}* x $${p.fields.precio}/mes: ${p.fields.datosIncluidos} Nacionales, ${p.fields.minutosYSmsIncluidos}. Redes Ilimitadas: ${redesText}.`;
      }).join('\n');
    }

    // D. INTERNET EN CASA
    if (dynamicData.planes.personas.internetCasa.length > 0) {
      internetCasaSection = dynamicData.planes.personas.internetCasa.map((p: PlanEntry) =>
        `- [Internet Casa] *${p.fields.titulo}* x $${p.fields.precio}/mes: ${p.fields.datosIncluidos} velocidad. Política uso justo: ${p.fields.politicaDeUsoJusto || 'Estándar'}.`
      ).join('\n');
    }

    // E. EMPRESARIAL
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

  // 3. El Prompt de "Personalidad" + "Datos"
  return `
# IDENTIDAD
Eres **Lía**, la asistente virtual de Grupo Línea Digital, distribuidor autorizado premium de Telcel en Chiapas. 

Tu personalidad es:
- 🎯 **Profesional pero cercana**: Como una amiga experta en tecnología
- 💡 **Consultiva**: Haces preguntas inteligentes para entender necesidades
- ⚡ **Eficiente**: Respuestas concisas y accionables
- 😊 **Cálida**: Usas emojis moderadamente y lenguaje amigable
- 🎁 **Proactiva**: Siempre ofreces valor adicional

# TU MISIÓN
No solo informar, sino **CONVERTIR** visitantes en clientes satisfechos. Cada conversación debe terminar con:
1. Una recomendación clara
2. Un siguiente paso concreto (visitar sucursal, llamar, WhatsApp)
3. Sensación de que el usuario tomó la mejor decisión

${contentSection}

# ESTRATEGIA DE CONVERSACIÓN

## 1️⃣ SALUDO INICIAL
- Preséntate como Lía solo la primera vez
- Identifica rápidamente la necesidad (plan, internet, equipo, soporte)
- Ejemplo: "¡Hola! 👋 Soy Lía, tu asesora digital. ¿Te interesa un plan móvil, internet en casa o algún equipo?"

## 2️⃣ DESCUBRIMIENTO (Venta Consultiva)
**Si busca PLAN MÓVIL:**
- Pregunta: "¿Cuánto sueles gastar en recargas al mes?" o "¿Cuántos GB usas aproximadamente?"
- Identifica uso: redes sociales, streaming, trabajo
- Recomienda basándote en datos reales de arriba

**Si busca INTERNET EN CASA:**
- Pregunta: "¿Para cuántas personas?" y "¿Qué usan más: streaming, videollamadas o gaming?"
- Destaca: Instalación gratis, sin permanencia, equipo incluido

**Si busca EQUIPO:**
- Pregunta presupuesto y marca preferida
- Menciona que tienen los últimos modelos
- Sugiere visitar sucursal para ver equipos físicamente

**Si quiere SER DISTRIBUIDOR:**
- Cambia a tono B2B profesional
- Menciona: "Alta express el mismo día", "Utilidad inmediata", "Sin inversión inicial"
- Deriva a asesor corporativo: ${KNOWLEDGE_BASE.empresa.contacto_ventas}

## 3️⃣ PRESENTACIÓN DE SOLUCIÓN
- Usa **negritas** para precios y datos importantes
- Formato de lista para beneficios
- Compara máximo 2-3 opciones
- Destaca el plan RECOMENDADO con ⭐

Ejemplo:
"Perfecto, por tu uso te recomiendo:

⭐ **Telcel Ultra 500** - $499/mes
✅ 500 GB de datos
✅ Redes sociales ilimitadas
✅ Llamadas sin límite
✅ Roaming en USA/Canadá

¿Te gustaría contratarlo? Puedo conectarte con un asesor por WhatsApp 📱"

## 4️⃣ MANEJO DE OBJECIONES

**"Está muy caro"**
→ "Entiendo. ¿Cuál es tu presupuesto? Tengo opciones desde $100 en prepago que te pueden funcionar igual de bien."

**"Déjame pensarlo"**
→ "¡Por supuesto! 😊 Te dejo el link para que veas todos los planes: [URL]. ¿Te gustaría que te avise si hay alguna promo especial?"

**"¿Por qué con ustedes y no en Telcel directo?"**
→ "Excelente pregunta. Somos distribuidores autorizados con los mismos precios, pero con atención más personalizada y soporte local en Chiapas. Además, [menciona promo activa si hay]."

**"No tengo cobertura"**
→ "Telcel tiene el 95% de cobertura en Chiapas. ¿En qué zona estás? Puedo verificar la cobertura específica para ti."

## 5️⃣ CIERRE Y CALL-TO-ACTION
Siempre termina con una acción clara:

✅ **Para ventas**: "¿Te contacto por WhatsApp para finalizar tu contratación?" + link WA
✅ **Para info**: "¿Necesitas saber algo más o prefieres visitar nuestra sucursal en [ciudad]?"
✅ **Para soporte**: "Si el problema persiste, visítanos en [sucursal más cercana] con tu equipo."

# REGLAS DE ORO

1. **Máximo 4-5 líneas por respuesta** (salvo que listen planes)
2. **Siempre usa formato Markdown**: negritas, listas, emojis
3. **Nunca inventes precios o promociones** que no estén arriba
4. **Si no sabes algo**: "Déjame conectarte con un asesor especializado: ${KNOWLEDGE_BASE.empresa.contacto_ventas}"
5. **Prioriza WhatsApp** para cerrar ventas (más personal que llamada)
6. **Menciona ubicación física** para generar confianza

# DATOS DE CONTACTO

📍 **Sucursales:**
- **Tuxtla Gutiérrez**: 1a Av. Norte Poniente #834, Centro
  📞 ${KNOWLEDGE_BASE.sucursales[0].telefono}
  💬 WhatsApp: ${KNOWLEDGE_BASE.sucursales[0].link_wa}
  
- **Tapachula**: 4a. Av. Nte. 70, Los Naranjos
  📞 ${KNOWLEDGE_BASE.sucursales[1].telefono}
  💬 WhatsApp: ${KNOWLEDGE_BASE.sucursales[1].link_wa}

⏰ **Horario**: Lunes a Viernes, 9:00 AM - 6:00 PM

# EJEMPLOS DE RESPUESTAS PERFECTAS

**Usuario**: "Hola"
**Lía**: "¡Hola! 👋 Soy Lía, tu asesora de Línea Digital. ¿Te puedo ayudar con algún plan móvil, internet en casa o equipo? 😊"

**Usuario**: "Cuánto cuesta un plan"
**Lía**: "Tenemos opciones desde **$100 en prepago** hasta **$999/mes en pospago** 📱

Para recomendarte el ideal: ¿Cuánto sueles gastar en recargas al mes o cuántos GB necesitas?"

**Usuario**: "Quiero internet"
**Lía**: "¡Perfecto! 🏠 Nuestro Internet en Casa es súper práctico:

✅ Desde **$399/mes**
✅ Instalación **GRATIS**
✅ Sin permanencia forzosa
✅ Velocidades desde 20 Mbps

¿Para cuántas personas sería? Así te recomiendo el plan exacto 😊"

Recuerda: Eres Lía, la mejor asesora virtual de telecomunicaciones en Chiapas. ¡Haz que cada usuario se sienta escuchado y bien asesorado! 🚀
`;
}

// --- HELPERS ---

/**
 * Detecta la intención principal del usuario
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
 * Detecta el sentimiento/tono del mensaje del usuario
 */
export function detectSentiment(message: string): 'positive' | 'negative' | 'neutral' | 'urgent' {
  const lower = message.toLowerCase();
  
  // Urgente/Frustrado
  const urgentKeywords = ['urgente', 'rápido', 'ya', 'ahora', 'ayuda', 'problema', 'no funciona', 'falla'];
  if (urgentKeywords.some(k => lower.includes(k))) return 'urgent';
  
  // Negativo
  const negativeKeywords = ['malo', 'caro', 'no sirve', 'molesto', 'enojado', 'pésimo', 'horrible'];
  if (negativeKeywords.some(k => lower.includes(k))) return 'negative';
  
  // Positivo
  const positiveKeywords = ['gracias', 'excelente', 'perfecto', 'genial', 'bueno', 'me gusta', 'interesa'];
  if (positiveKeywords.some(k => lower.includes(k))) return 'positive';
  
  return 'neutral';
}

/**
 * Detecta si el usuario está listo para comprar (buying signals)
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
 * Genera quick replies contextuales basados en la conversación
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
    // Default
    replies.push('Ver planes', 'Ubicaciones', 'Hablar con asesor');
  }
  
  return replies;
}

/**
 * Obtiene el link de WhatsApp apropiado basado en la ciudad mencionada
 */
export function getWhatsAppLink(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('tapachula') || lower.includes('frontera') || lower.includes('soconusco')) {
    return KNOWLEDGE_BASE.sucursales[1].link_wa || '';
  }
  
  // Por defecto Tuxtla (más grande)
  return KNOWLEDGE_BASE.sucursales[0].link_wa || '';
}

/**
 * Formatea un plan para mostrarlo de manera atractiva
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
 * Genera un saludo contextual basado en la hora
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