import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
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

  @ApiPropertyOptional({
    example: false,
    description:
      'Indica si el usuario debe aparecer como destinatario en guías de remisión.',
  })
  @IsOptional()
  @IsBoolean()
  esDestinatario?: boolean;

  @ApiPropertyOptional({
    example: '0953449246',
    description: 'Cédula (10 dígitos) o RUC (13 dígitos) del destinatario.',
  })
  @ValidateIf(
    (dto: CreateUserDto) =>
      dto.esDestinatario === true || dto.identificacion !== undefined,
  )
  @IsString()
  @Matches(/^(?:\d{10}|\d{13})$/, {
    message:
      'La identificación debe ser una cédula de 10 dígitos o un RUC de 13 dígitos.',
  })
  identificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Listado de reportes habilitados para el usuario. Vacío = acceso a todos.',
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