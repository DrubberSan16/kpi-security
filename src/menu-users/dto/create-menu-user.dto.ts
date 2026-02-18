import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMenuUserDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  menuId: string;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReaded?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCreated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEdited?: boolean;

  // 👇 OJO: en entity se llama permitDeleted
  @ApiPropertyOptional({ description: 'Permiso para eliminar (columna is_deleted)' })
  @IsOptional()
  @IsBoolean()
  permitDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReports?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportsPermit?: string;
}
