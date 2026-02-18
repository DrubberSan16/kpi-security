import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenuUsersController } from './menu-users.controller';
import { MenuUsersService } from './menu-users.service';

import { TbMenuUser } from '../database/entities/tb-menu-user.entity';
import { TbUser } from '../database/entities/tb-user.entity';
import { TbMenu } from '../database/entities/tb-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbMenuUser, TbUser, TbMenu])],
  controllers: [MenuUsersController],
  providers: [MenuUsersService],
})
export class MenuUsersModule {}
