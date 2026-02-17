import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TbRole } from '../database/entities/tb-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbRole])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
