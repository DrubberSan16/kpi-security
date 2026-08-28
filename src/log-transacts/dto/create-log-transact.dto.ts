import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLogTransactDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  moduleMicroservice: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typeLog?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ maxLength: 10, example: 'POST' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  requestMethod?: string;

  @ApiPropertyOptional({ example: '/kpi_maintenance/equipos' })
  @IsOptional()
  @IsString()
  requestUrl?: string;

  @ApiPropertyOptional({
    description:
      'Datos enviados en la solicitud. Se guardan en jsonb con las claves sensibles enmascaradas.',
  })
  @IsOptional()
  @Allow()
  requestPayload?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;
}
