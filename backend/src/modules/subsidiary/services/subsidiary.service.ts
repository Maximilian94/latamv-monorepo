import { Injectable } from '@nestjs/common';
import { SubsidiaryRepository } from '../repositories/subsidiary.repository';
import {
  SubsidiaryResponseDto,
  SubsidiaryWithBasesResponseDto,
  BaseWithAirportsResponseDto,
} from '../dto/subsidiary.dto';

@Injectable()
export class SubsidiaryService {
  constructor(private readonly subsidiaryRepository: SubsidiaryRepository) {}

  async findAll(): Promise<SubsidiaryResponseDto[]> {
    return this.subsidiaryRepository.findAll();
  }

  async findAllWithBases(): Promise<SubsidiaryWithBasesResponseDto[]> {
    return this.subsidiaryRepository.findAllWithBases();
  }

  async findById(id: number): Promise<SubsidiaryResponseDto | null> {
    return this.subsidiaryRepository.findById(id);
  }

  async findByIdWithBases(
    id: number,
  ): Promise<SubsidiaryWithBasesResponseDto | null> {
    return this.subsidiaryRepository.findByIdWithBases(id);
  }

  async findByCode(code: string): Promise<SubsidiaryResponseDto | null> {
    return this.subsidiaryRepository.findByCode(code);
  }

  async findBasesBySubsidiaryId(
    subsidiaryId: number,
  ): Promise<BaseWithAirportsResponseDto[]> {
    return this.subsidiaryRepository.findBasesBySubsidiaryId(subsidiaryId);
  }
}
