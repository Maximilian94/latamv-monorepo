import { IsString, IsObject } from 'class-validator';

export class TestRuleDto {
  @IsString()
  expr: string;

  @IsObject()
  frame: Record<string, any>;
}
