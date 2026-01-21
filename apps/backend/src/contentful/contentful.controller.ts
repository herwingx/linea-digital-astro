import { Controller, Get } from '@nestjs/common';
import { ContentfulService, PromoEntry, PlanEntry } from './contentful.service';

@Controller('content')
export class ContentfulController {
  constructor(private readonly contentfulService: ContentfulService) { }

  @Get('promos')
  async getPromos(): Promise<PromoEntry[]> {
    return this.contentfulService.getActivePromos();
  }

  @Get('planes/libre')
  async getPlansLibre(): Promise<PlanEntry[]> {
    return this.contentfulService.getPlansLibre();
  }

  @Get('planes/ultra')
  async getPlansUltra(): Promise<PlanEntry[]> {
    return this.contentfulService.getPlansUltra();
  }

  @Get('planes/internet')
  async getPlansInternet(): Promise<PlanEntry[]> {
    return this.contentfulService.getPlansInternet();
  }

  @Get('planes/casa-libre')
  async getInternetEnTuCasaLibre(): Promise<PlanEntry[]> {
    return this.contentfulService.getInternetEnTuCasaLibre();
  }

  @Get('planes/empresa')
  async getPlansEmpresas(): Promise<PlanEntry[]> {
    return this.contentfulService.getPlansEmpresas();
  }

  @Get('planes/empresa-ultra')
  async getPlansEmpresasUltra(): Promise<PlanEntry[]> {
    return this.contentfulService.getPlansEmpresasUltra();
  }

  @Get('planes/internet-empresa')
  async getPlansInternetEmpresa(): Promise<PlanEntry[]> {
    return this.contentfulService.getPlansInternetEmpresa();
  }

  @Get('planes/internet-empresa-casa')
  async getInternetEnTuEmpresa(): Promise<PlanEntry[]> {
    return this.contentfulService.getInternetEnTuEmpresa();
  }

  @Get('knowledge')
  async getKnowledge() {
    return this.contentfulService.getAllChatbotKnowledge();
  }
}
