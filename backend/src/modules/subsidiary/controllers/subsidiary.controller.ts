import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SubsidiaryService } from '../services/subsidiary.service';
import {
  SubsidiaryResponseDto,
  SubsidiaryWithBasesResponseDto,
  BaseWithAirportsResponseDto,
} from '../dto/subsidiary.dto';

@Controller('subsidiaries')
export class SubsidiaryController {
  constructor(private readonly subsidiaryService: SubsidiaryService) {}

  @Get()
  async findAll(): Promise<SubsidiaryResponseDto[]> {
    return this.subsidiaryService.findAll();
  }

  @Get('with-bases')
  async findAllWithBases(): Promise<SubsidiaryWithBasesResponseDto[]> {
    return this.subsidiaryService.findAllWithBases();
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SubsidiaryResponseDto | null> {
    return this.subsidiaryService.findById(id);
  }

  @Get(':id/with-bases')
  async findByIdWithBases(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SubsidiaryWithBasesResponseDto | null> {
    return this.subsidiaryService.findByIdWithBases(id);
  }

  @Get(':id/bases')
  async findBasesBySubsidiaryId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseWithAirportsResponseDto[]> {
    return this.subsidiaryService.findBasesBySubsidiaryId(id);
  }
}
