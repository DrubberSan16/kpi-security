import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
}
