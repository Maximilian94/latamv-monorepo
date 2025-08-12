export interface Award {
  id: number;
  name: string;
  image?: string;
  description: string;
  tooltip: string;
  validityDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAwardDto {
  name: string;
  image?: string;
  description: string;
  tooltip: string;
  validityDuration: number;
}

export interface UpdateAwardDto {
  name?: string;
  image?: string;
  description?: string;
  tooltip?: string;
  validityDuration?: number;
}
