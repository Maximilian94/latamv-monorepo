export class SubsidiaryResponseDto {
  id: number;
  name: string;
  code: string;
  icaoCode: string;
  description?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BaseResponseDto {
  id: number;
  name: string;
  description?: string;
  city: string;
  state: string;
  country: string;
  subsidiaryId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BaseAirportResponseDto {
  id: number;
  baseId: number;
  airportCode: string;
  createdAt: Date;
}

export class SubsidiaryWithBasesResponseDto extends SubsidiaryResponseDto {
  bases: BaseWithAirportsResponseDto[];
}

export class BaseWithAirportsResponseDto extends BaseResponseDto {
  baseAirports: BaseAirportResponseDto[];
}
