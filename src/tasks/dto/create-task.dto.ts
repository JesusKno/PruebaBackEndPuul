import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Prisma Decimal acepta number/string, para API lo validamos como number
  @IsNumber()
  estimatedHours: number;

  @IsOptional()
  @IsNumber()
  spentHours?: number;

  // ISO 8601: "2026-03-01T00:00:00.000Z"
  @IsDateString()
  dueDate: string;

  // Catálogo TaskStatus.name_status
  @IsIn(['ACTIVA', 'TERMINADA'])
  status: 'ACTIVA' | 'TERMINADA';

  @IsNumber()
  cost: number;
}
