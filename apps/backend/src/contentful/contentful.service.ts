import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ContentfulClientApi, Entry, EntrySkeletonType, Asset } from 'contentful';

export interface PromoFields extends EntrySkeletonType {
  titulo: string;
  descripcion: string;
  etiqueta?: string;
  fechaFin?: string;
  enlace?: string;
  activa: boolean;
  imagen: Asset;
}

export interface PlanFields extends EntrySkeletonType {
  titulo: string;
  datosIncluidos: string;
  minutosYSmsIncluidos: string;
  cashbackTelcel: string;
  precio: number;
  redesSociales?: string[];
  recomendado?: boolean;
  enlace?: string;
  politicaDeUsoJusto?: string;
  velocidadDeNavegacion?: string;
}

export type PromoEntry = Entry<PromoFields, undefined, string>;
export type PlanEntry = Entry<PlanFields, undefined, string>;

@Injectable()
export class ContentfulService {
  private client: ContentfulClientApi<undefined> | null = null;
  private readonly logger = new Logger(ContentfulService.name);

  constructor(private configService: ConfigService) {
    const spaceId = this.configService.get<string>('CONTENTFUL_SPACE_ID');
    const accessToken = this.configService.get<string>('CONTENTFUL_ACCESS_TOKEN');

    if (!spaceId || !accessToken) {
      this.logger.warn('⚠️ Contentful disabled: Missing credentials in .env');
    } else {
      try {
        this.client = createClient({
          space: spaceId,
          accessToken: accessToken,
        });
      } catch (e) {
        this.logger.error('Failed to initialize Contentful client', e);
      }
    }
  }

  async getActivePromos(): Promise<PromoEntry[]> {
    if (!this.client) return [];
    try {
      const entries = await this.client.getEntries<PromoFields>({
        content_type: 'promocion',
        'fields.activa': true,
      });
      return entries.items as PromoEntry[];
    } catch (error) {
      this.logger.error('Error fetching promotions', error);
      return [];
    }
  }

  async getPlansLibre(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('planesTelcelLibre', 'fields.precio');
  }

  async getPlansUltra(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('planesTelcelUltra', 'fields.precio');
  }

  async getPlansInternet(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('planesInternetLibre', 'fields.precio');
  }

  async getInternetEnTuCasaLibre(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('internetEnTuCasaLibre', 'fields.precio');
  }

  async getPlansEmpresas(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('planesTelcelEmpresa', 'fields.precio');
  }

  async getPlansEmpresasUltra(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('planesTelcelUltraEmpresa', 'fields.precio');
  }

  async getPlansInternetEmpresa(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('planesInternetEmpresa', 'fields.precio');
  }

  async getInternetEnTuEmpresa(): Promise<PlanEntry[]> {
    return this.getEntries<PlanFields>('internetEnTuEmpresa', 'fields.precio');
  }

  private async getEntries<T extends EntrySkeletonType>(contentType: string, orderField: string): Promise<Entry<T, undefined, string>[]> {
    if (!this.client) return [];
    try {
      const entries = await this.client.getEntries<T>({
        content_type: contentType,
        order: [orderField] as any,
      });
      return entries.items;
    } catch (error) {
      this.logger.error(`Error fetching ${contentType}`, error);
      return [];
    }
  }

  async getAllChatbotKnowledge() {
    this.logger.log('Fetching all chatbot knowledge...');

    if (!this.client) {
      this.logger.warn('Skipping knowledge fetch: Contentful disabled');
      return null;
    }

    try {
      const [
        promos,
        planesLibre,
        planesUltra,
        planesInternet,
        internetCasaLibre,
        planesEmpresas,
        planesEmpresasUltra,
        planesInternetEmpresa,
        internetEmpresa,
      ] = await Promise.all([
        this.getActivePromos(),
        this.getPlansLibre(),
        this.getPlansUltra(),
        this.getPlansInternet(),
        this.getInternetEnTuCasaLibre(),
        this.getPlansEmpresas(),
        this.getPlansEmpresasUltra(),
        this.getPlansInternetEmpresa(),
        this.getInternetEnTuEmpresa(),
      ]);

      return {
        promociones: promos,
        planes: {
          personas: {
            libre: planesLibre,
            ultra: planesUltra,
            internet: planesInternet,
            internetCasa: internetCasaLibre,
          },
          empresas: {
            libre: planesEmpresas,
            ultra: planesEmpresasUltra,
            internet: planesInternetEmpresa,
            internetEmpresa: internetEmpresa,
          },
        },
      };
    } catch (error) {
      this.logger.error('Error fetching chatbot knowledge', error);
      return null;
    }
  }
}
