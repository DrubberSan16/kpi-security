import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario01' })
  @IsString()
  @IsNotEmpty()
  nameUser: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  passUser: string;
}
