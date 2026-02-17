import { Module } from '@nestjs/common';
import { MenuRolesService } from './menu-roles.service';
import { MenuRolesController } from './menu-roles.controller';

@Module({
  controllers: [MenuRolesController],
  providers: [MenuRolesService],
})
export class MenuRolesModule {}
