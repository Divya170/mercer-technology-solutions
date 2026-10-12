import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from './inquiry.entity';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { NotifierService } from './notifier.service';
import { SettingsModule } from '../settings/settings.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry]), SettingsModule, ServicesModule],
  providers: [InquiriesService, NotifierService],
  controllers: [InquiriesController],
})
export class InquiriesModule {}
