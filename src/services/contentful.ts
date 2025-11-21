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
}

// The entry type that Contentful returns
type PromoEntry = Entry<PromoFields, undefined, string>;
type PlanEntry = Entry<PlanFields, undefined, string>;

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
export async function getPlans(): Promise<PlanEntry[]> {
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