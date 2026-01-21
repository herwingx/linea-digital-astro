import { createClient, type Entry, type Asset, type EntrySkeletonType } from 'contentful';

// Define the shape of our promotion fields
/**
 * Define la estructura de los campos para una promoción en Contentful.
 */
interface PromoFields extends EntrySkeletonType {
  /** El título principal de la promoción. */
  titulo: string;
  /** Una descripción detallada de la promoción. */
  descripcion: string;
  /** Una etiqueta opcional para categorizar la promoción (ej. "Exclusivo Web"). */
  etiqueta?: string;
  /** La fecha en que finaliza la promoción (formato ISO). */
  fechaFin?: string;
  /** Un enlace opcional para más detalles o para aplicar a la promoción. */
  enlace?: string;
  /** Un booleano que indica si la promoción está activa o no. */
  activa: boolean;
  /** La imagen principal asociada a la promoción, como un activo de Contentful. */
  imagen: Asset;
}

// Estos nombres (keys) deben coincidir EXACTAMENTE con los "Field ID" de Contentful
/**
 * Define la estructura de los campos para un plan de Telcel en Contentful.
 * Se utiliza para planes de personas y empresas, tanto móviles como de internet.
 */
interface PlanFields extends EntrySkeletonType {
  /** El nombre oficial del plan. */
  titulo: string;
  /** La cantidad de datos incluida, como texto (ej. "24 GB"). */
  datosIncluidos: string;
  /** El número de minutos y SMS incluidos, como texto (ej. "Ilimitados"). */
  minutosYSmsIncluidos: string;
  /** El monto de cashback ofrecido, si aplica, como texto. */
  cashbackTelcel: string;
  /** El costo mensual del plan en MXN. */
  precio: number;
  /** Una lista opcional de nombres de redes sociales incluidas. */
  redesSociales?: string[];
  /** Un booleano opcional para destacar el plan como "Recomendado". */
  recomendado?: boolean;
  /** Un enlace opcional a una página de destino para el plan. */
  enlace?: string;
  /** Texto opcional que describe la política de uso justo. */
  politicaDeUsoJusto?: string;
  /** La velocidad de navegación, principalmente para planes de internet en casa/empresa. */
  velocidadDeNavegacion?: string;
}


/** Representa una entrada de Contentful para una Promoción. */
export type PromoEntry = Entry<PromoFields, undefined, string>;
/** Representa una entrada de Contentful para un Plan Telcel. */
export type PlanEntry = Entry<PlanFields, undefined, string>;

// Initialize the Contentful client
const spaceId = import.meta.env.CONTENTFUL_SPACE_ID as string;
const accessToken = import.meta.env.CONTENTFUL_ACCESS_TOKEN as string;

const client = (spaceId && accessToken) ? createClient({
  space: spaceId,
  accessToken: accessToken,
}) : null;

/**
 * Obtiene todas las promociones marcadas como "activas" desde Contentful.
 * En caso de error en la petición, devuelve un array vacío y lo registra en consola.
 * @returns Una promesa que resuelve a un array de entradas de promoción (`PromoEntry`).
 */
export async function getActivePromos(): Promise<PromoEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PromoFields>({
      content_type: 'promocion',
      'fields.activa': true,
    });
    return entries.items as PromoEntry[];
  } catch (error) {
    console.error('Error fetching promotions from Contentful:', error);
    return [];
  }
}

// --- NUEVA FUNCIÓN PARA TRAER PLANES ---
/**
 * Obtiene los planes Telcel "Libre" para personas desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getPlansLibre(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelLibre',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes Telcel "Ultra" para personas desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getPlansUltra(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelUltra',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes de "Internet Libre" para personas desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getPlansInternet(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesInternetLibre',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes de "Internet en tu Casa Libre" desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getInternetEnTuCasaLibre(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'internetEnTuCasaLibre',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes Telcel "Empresa" desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getPlansEmpresas(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelEmpresa',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes Telcel "Ultra Empresa" desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getPlansEmpresasUltra(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelUltraEmpresa',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes de "Internet Empresa" desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getPlansInternetEmpresa(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesInternetEmpresa',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

/**
 * Obtiene los planes de "Internet en tu Empresa" desde Contentful, ordenados por precio.
 * @returns Una promesa que resuelve a un array de entradas de planes (`PlanEntry`).
 */
export async function getInternetEnTuEmpresa(): Promise<PlanEntry[]> {
  if (!client) return [];
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'internetEnTuEmpresa',
      order: ['fields.precio'],
    });
    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}


// ============================================
// FUNCIÓN PARA OBTENER TODOS LOS DATOS DEL CHATBOT KNOWLEDGE BASE
// ============================================
/**
 * Obtiene de forma paralela todos los tipos de planes y promociones desde Contentful
 * para construir una base de conocimiento completa para el chatbot.
 * @returns Una promesa que resuelve a un objeto (`knowledgeBase`) con todos los datos organizados, o `null` si ocurre un error.
 */
export async function getAllChatbotKnowledge() {
  console.log('🤖 ===== INICIANDO OBTENCIÓN DE DATOS PARA CHATBOT =====');

  try {
    // Obtener todos los datos en paralelo
    const [
      promos,
      planesLibre,
      planesUltra,
      planesInternet,
      internetCasaLibre,
      planesEmpresas,
      planesEmpresasUltra,
      planesInternetEmpresa,
      internetEmpresa
    ] = await Promise.all([
      getActivePromos(),
      getPlansLibre(),
      getPlansUltra(),
      getPlansInternet(),
      getInternetEnTuCasaLibre(),
      getPlansEmpresas(),
      getPlansEmpresasUltra(),
      getPlansInternetEmpresa(),
      getInternetEnTuEmpresa()
    ]);

    // Crear objeto con todos los datos
    const knowledgeBase = {
      promociones: promos,
      planes: {
        personas: {
          libre: planesLibre,
          ultra: planesUltra,
          internet: planesInternet,
          internetCasa: internetCasaLibre
        },
        empresas: {
          libre: planesEmpresas,
          ultra: planesEmpresasUltra,
          internet: planesInternetEmpresa,
          internetEmpresa: internetEmpresa
        }
      }
    };

    return knowledgeBase;
  } catch (error) {
    console.error('❌ Error obteniendo datos para chatbot:', error);
    return null;
  }
}
