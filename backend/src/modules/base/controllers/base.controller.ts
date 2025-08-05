import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BaseService } from '../services/base.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { CreateBaseDto, UpdateBaseDto, AddAirportDto } from '../dto/base.dto';

@Controller('bases')
@UseGuards(AuthGuard)
export class BaseController {
  constructor(private baseService: BaseService) {}

  @Post()
  createBase(@Body() createBaseDto: CreateBaseDto) {
    return this.baseService.createBase({
      ...createBaseDto,
      subsidiary: {
        connect: { id: createBaseDto.subsidiaryId },
      },
    });
  }

  @Get()
  getAllBases() {
    return this.baseService.getAllBases();
  }

  @Get('with-users')
  getBasesWithUsers() {
    return this.baseService.getBasesWithUsers();
  }

  @Get(':id')
  getBaseById(@Param('id') id: string) {
    return this.baseService.getBaseById(+id);
  }

  @Put(':id')
  updateBase(@Param('id') id: string, @Body() updateBaseDto: UpdateBaseDto) {
    return this.baseService.updateBase(+id, updateBaseDto);
  }

  @Delete(':id')
  deleteBase(@Param('id') id: string) {
    return this.baseService.deleteBase(+id);
  }

  @Post(':id/airports')
  addAirportToBase(
    @Param('id') id: string,
    @Body() addAirportDto: AddAirportDto,
  ) {
    return this.baseService.addAirportToBase(+id, addAirportDto.airportCode);
  }

  @Delete(':id/airports/:airportCode')
  removeAirportFromBase(
    @Param('id') id: string,
    @Param('airportCode') airportCode: string,
  ) {
    return this.baseService.removeAirportFromBase(+id, airportCode);
  }

  @Get('airport/:airportCode')
  getBaseByAirportCode(@Param('airportCode') airportCode: string) {
    return this.baseService.getBaseByAirportCode(airportCode);
  }
}
