import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenuRolesController } from './menu-roles.controller';
import { MenuRolesService } from './menu-roles.service';

import { TbMenuRole } from '../database/entities/tb-menu-role.entity';
import { TbRole } from '../database/entities/tb-role.entity';
import { TbMenu } from '../database/entities/tb-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbMenuRole, TbRole, TbMenu])],
  controllers: [MenuRolesController],
  providers: [MenuRolesService],
})
export class MenuRolesModule {}
