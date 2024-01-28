import { Controller, Get } from '@nestjs/common';
import { CGNAService } from '../service/cgna.service';

@Controller('routes')
export class RoutesController {
  constructor(private cgnaService: CGNAService) {}

  @Get('cgna')
  async getAll() {
    return this.cgnaService.getCGNARoutes();
  }
}
