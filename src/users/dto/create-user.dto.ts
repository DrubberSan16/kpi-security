import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameUser: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passUser: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameSurname: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  dateBirthday?: string;

  @ApiProperty()
  @IsUUID()
  roleId: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Listado de reportes habilitados para el usuario. Vacío = acceso a todos.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reportes?: string[];

  @ApiPropertyOptional({
    type: [String],
    description:
      'Listado de sucursales habilitadas para el usuario. Vacio = acceso a todas las sucursales activas.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sucursales?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
