import { Module } from '@nestjs/common';
import { ContentfulService } from './contentful.service';
import { ContentfulController } from './contentful.controller';

@Module({
  providers: [ContentfulService],
  controllers: [ContentfulController],
  exports: [ContentfulService],
})
export class ContentfulModule { }
