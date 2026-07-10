import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProceduresService } from '../services/procedures.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ManageProceduresGuard } from '../../../common/guards/manage-procedures.guard';
import { CreateProcedureVersionDto } from '../dto/create-procedure-version.dto';
import { UpdateProcedureVersionDto } from '../dto/update-procedure-version.dto';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { CreateSubPhaseDto } from '../dto/create-subphase.dto';
import { UpdateSubPhaseDto } from '../dto/update-subphase.dto';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';
import { CreateDatarefDto } from '../dto/create-dataref.dto';
import { UpdateDatarefDto } from '../dto/update-dataref.dto';
import { TestRuleDto } from '../dto/test-rule.dto';
import {
  ProcedureVersionSummaryDto,
  ProcedureVersionTreeDto,
  PublishedBundleDto,
} from '../dto/procedure-version-response.dto';

@Controller('procedures')
@UseGuards(AuthGuard)
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  // ===== Versions =====

  @Get('versions')
  listVersions(
    @Query('aircraftModelCode') aircraftModelCode?: string,
  ): Promise<ProcedureVersionSummaryDto[]> {
    return this.proceduresService.listVersions(aircraftModelCode);
  }

  @Get('versions/:id')
  getVersion(@Param('id') id: string): Promise<ProcedureVersionTreeDto> {
    return this.proceduresService.getVersion(+id);
  }

  // Bundle for any version (draft included) — lets the desktop test an
  // unpublished draft in real time before publishing it.
  @Get('versions/:id/bundle')
  getVersionBundle(@Param('id') id: string): Promise<PublishedBundleDto> {
    return this.proceduresService.getVersionBundle(+id);
  }

  @Post('versions')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createVersion(
    @Body() dto: CreateProcedureVersionDto,
  ): Promise<ProcedureVersionSummaryDto> {
    return this.proceduresService.createVersion(dto);
  }

  @Patch('versions/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updateVersion(
    @Param('id') id: string,
    @Body() dto: UpdateProcedureVersionDto,
  ): Promise<ProcedureVersionTreeDto> {
    return this.proceduresService.updateVersion(+id, dto);
  }

  @Delete('versions/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deleteVersion(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deleteVersion(+id);
  }

  @Post('versions/:id/publish')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  publishVersion(
    @Param('id') id: string,
  ): Promise<ProcedureVersionTreeDto> {
    return this.proceduresService.publishVersion(+id);
  }

  @Post('versions/:id/new-draft')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  newDraft(@Param('id') id: string): Promise<ProcedureVersionTreeDto> {
    return this.proceduresService.newDraftFromPublished(+id);
  }

  @Get('published')
  getPublished(
    @Query('aircraftModelCode') aircraftModelCode: string,
  ): Promise<PublishedBundleDto> {
    return this.proceduresService.getPublishedBundle(aircraftModelCode);
  }

  // ===== Phases =====

  @Post('phases')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createPhase(@Body() dto: CreatePhaseDto) {
    return this.proceduresService.createPhase(dto);
  }

  @Patch('phases/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updatePhase(@Param('id') id: string, @Body() dto: UpdatePhaseDto) {
    return this.proceduresService.updatePhase(+id, dto);
  }

  @Delete('phases/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deletePhase(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deletePhase(+id);
  }

  // ===== SubPhases =====

  @Post('subphases')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createSubPhase(@Body() dto: CreateSubPhaseDto) {
    return this.proceduresService.createSubPhase(dto);
  }

  @Patch('subphases/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updateSubPhase(@Param('id') id: string, @Body() dto: UpdateSubPhaseDto) {
    return this.proceduresService.updateSubPhase(+id, dto);
  }

  @Delete('subphases/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deleteSubPhase(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deleteSubPhase(+id);
  }

  // ===== Checklist Items =====

  @Post('items')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createItem(@Body() dto: CreateItemDto) {
    return this.proceduresService.createItem(dto);
  }

  @Patch('items/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.proceduresService.updateItem(+id, dto);
  }

  @Delete('items/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deleteItem(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deleteItem(+id);
  }

  // ===== Events =====

  @Post('events')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createEvent(@Body() dto: CreateEventDto) {
    return this.proceduresService.createEvent(dto);
  }

  @Patch('events/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updateEvent(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.proceduresService.updateEvent(id, dto);
  }

  @Delete('events/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deleteEvent(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deleteEvent(id);
  }

  // ===== Validation Rules =====

  @Post('rules/test')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  testRule(@Body() dto: TestRuleDto) {
    return this.proceduresService.testRule(dto);
  }

  @Post('rules')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createRule(@Body() dto: CreateRuleDto) {
    return this.proceduresService.createRule(dto);
  }

  @Patch('rules/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updateRule(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.proceduresService.updateRule(+id, dto);
  }

  @Delete('rules/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deleteRule(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deleteRule(+id);
  }

  // ===== Aircraft Packages =====

  @Get('packages')
  listPackages() {
    return this.proceduresService.listPackages();
  }

  @Post('packages')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createPackage(@Body() dto: CreatePackageDto) {
    return this.proceduresService.createPackage(dto);
  }

  @Patch('packages/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.proceduresService.updatePackage(+id, dto);
  }

  @Delete('packages/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deletePackage(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deletePackage(+id);
  }

  // ===== Dataref Catalog =====

  @Post('datarefs')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  createDataref(@Body() dto: CreateDatarefDto) {
    return this.proceduresService.createDataref(dto);
  }

  @Patch('datarefs/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  updateDataref(@Param('id') id: string, @Body() dto: UpdateDatarefDto) {
    return this.proceduresService.updateDataref(+id, dto);
  }

  @Delete('datarefs/:id')
  @UseGuards(AuthGuard, ManageProceduresGuard)
  deleteDataref(@Param('id') id: string): Promise<void> {
    return this.proceduresService.deleteDataref(+id);
  }
}
