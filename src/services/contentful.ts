import { createClient, type Entry, type Asset, type EntrySkeletonType } from 'contentful';

// Define the shape of our promotion fields
interface PromoFields extends EntrySkeletonType {
  titulo: string;
  descripcion: string;
  etiqueta?: string;
  fechaFin?: string;
  enlace?: string;
  activa: boolean;
  imagen: Asset;
}

// Estos nombres (keys) deben coincidir EXACTAMENTE con los "Field ID" de Contentful
interface PlanFields extends EntrySkeletonType {
  titulo: string;           // Short text
  datosIncluidos: string;    // Short text (ej: "24 GB")  
  minutosYSmsIncluidos: string;    // Short text (ej: "1000")
  cashbackTelcel: string;    // Short text (ej: "1000")
  precio: number;           // Number (Decimal)
  redesSociales?: string[]; // List (Text) - Puede ser undefined si no marcan nada
  recomendado?: boolean;   // Boolean
  enlace?: string;           // Short text (URL)
  politicaDeUsoJusto?: string;   // Long text
  velocidadDeNavegacion?: string; // Short text
}


// The entry type that Contentful returns
export type PromoEntry = Entry<PromoFields, undefined, string>;
export type PlanEntry = Entry<PlanFields, undefined, string>;

// Initialize the Contentful client
const client = createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID as string,
  accessToken: import.meta.env.CONTENTFUL_ACCESS_TOKEN as string,
});

// This function fetches all promotions marked as "active" from Contentful
export async function getActivePromos(): Promise<PromoEntry[]> {
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
export async function getPlansLibre(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelLibre',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],

    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

export async function getPlansUltra(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelUltra',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],

    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

export async function getPlansInternet(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesInternetLibre',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],

    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

export async function getInternetEnTuCasaLibre(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'internetEnTuCasaLibre',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],

    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

export async function getPlansEmpresas(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelEmpresa',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],
    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

export async function getPlansEmpresasUltra(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesTelcelUltraEmpresa',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],
    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}


export async function getPlansInternetEmpresa(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'planesInternetEmpresa',
      // Opcional: Ordenar por precio ascendente
      order: ['fields.precio'],

    });

    return entries.items as PlanEntry[];
  } catch (error) {
    console.error('Error obteniendo planes de Contentful:', error);
    return [];
  }
}

export async function getInternetEnTuEmpresa(): Promise<PlanEntry[]> {
  try {
    const entries = await client.getEntries<PlanFields>({
      content_type: 'internetEnTuEmpresa',
      // Opcional: Ordenar por precio ascendente
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

    // Logs detallados por categoría
    console.log('\n📢 PROMOCIONES ACTIVAS:', promos.length);
    console.log(JSON.stringify(promos, null, 2));

    console.log('\n👤 PLANES PERSONAS - LIBRE:', planesLibre.length);
    console.log(JSON.stringify(planesLibre, null, 2));

    console.log('\n👤 PLANES PERSONAS - ULTRA:', planesUltra.length);
    console.log(JSON.stringify(planesUltra, null, 2));

    console.log('\n👤 PLANES PERSONAS - INTERNET:', planesInternet.length);
    console.log(JSON.stringify(planesInternet, null, 2));

    console.log('\n🏠 INTERNET EN TU CASA - LIBRE:', internetCasaLibre.length);
    console.log(JSON.stringify(internetCasaLibre, null, 2));

    console.log('\n🏢 PLANES EMPRESAS - LIBRE:', planesEmpresas.length);
    console.log(JSON.stringify(planesEmpresas, null, 2));

    console.log('\n🏢 PLANES EMPRESAS - ULTRA:', planesEmpresasUltra.length);
    console.log(JSON.stringify(planesEmpresasUltra, null, 2));

    console.log('\n🏢 PLANES EMPRESAS - INTERNET:', planesInternetEmpresa.length);
    console.log(JSON.stringify(planesInternetEmpresa, null, 2));

    console.log('\n🏢 INTERNET EN TU EMPRESA:', internetEmpresa.length);
    console.log(JSON.stringify(internetEmpresa, null, 2));

    // Resumen total
    const totalItems =
      promos.length +
      planesLibre.length +
      planesUltra.length +
      planesInternet.length +
      internetCasaLibre.length +
      planesEmpresas.length +
      planesEmpresasUltra.length +
      planesInternetEmpresa.length +
      internetEmpresa.length;

    console.log('\n📊 ===== RESUMEN TOTAL =====');
    console.log(`Total de items en knowledge base: ${totalItems}`);
    console.log('Desglose:');
    console.log(`  - Promociones: ${promos.length}`);
    console.log(`  - Planes Personas Libre: ${planesLibre.length}`);
    console.log(`  - Planes Personas Ultra: ${planesUltra.length}`);
    console.log(`  - Planes Internet Personas: ${planesInternet.length}`);
    console.log(`  - Internet Casa Libre: ${internetCasaLibre.length}`);
    console.log(`  - Planes Empresas Libre: ${planesEmpresas.length}`);
    console.log(`  - Planes Empresas Ultra: ${planesEmpresasUltra.length}`);
    console.log(`  - Planes Internet Empresas: ${planesInternetEmpresa.length}`);
    console.log(`  - Internet Empresa: ${internetEmpresa.length}`);
    console.log('🤖 ===== FIN DE DATOS PARA CHATBOT =====\n');

    return knowledgeBase;
  } catch (error) {
    console.error('❌ Error obteniendo datos para chatbot:', error);
    return null;
  }
}
