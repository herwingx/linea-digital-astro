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

// The entry type that Contentful returns
type PromoEntry = Entry<PromoFields, undefined, string>;

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