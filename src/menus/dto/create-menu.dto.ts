import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'UUID del menú padre (menu_id)' })
  @IsOptional()
  @IsUUID()
  menuId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  urlComponent?: string;

  // menu_position es bigint: recibimos como string numérica o number
  @ApiProperty({ example: '1', description: 'Posición del menú (bigint). Enviar como string numérica' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'menuPosition debe ser numérico (string)' })
  menuPosition: string;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;
}
