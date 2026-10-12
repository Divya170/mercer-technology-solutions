import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service]), SettingsModule],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
