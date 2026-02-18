import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;
}
