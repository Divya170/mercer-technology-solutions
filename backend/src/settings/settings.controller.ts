import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './settings.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  getPublic() {
    return this.settings.getPublic();
  }

  @Get('settings/admin')
  @UseGuards(JwtAuthGuard)
  getAdmin() {
    return this.settings.get();
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
