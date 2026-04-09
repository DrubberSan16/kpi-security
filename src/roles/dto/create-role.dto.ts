import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Listado de reportes habilitados para el rol. Vacío = acceso a todos.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reportes?: string[];
}
