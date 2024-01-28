import { Controller, Get } from '@nestjs/common';

@Controller('routes')
export class CatsController {
  @Get('cgna')
  getAll(): string {
    return 'This action returns all cats';
  }
}
