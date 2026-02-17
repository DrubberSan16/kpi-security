import { Module } from '@nestjs/common';
import { MenuUsersService } from './menu-users.service';
import { MenuUsersController } from './menu-users.controller';

@Module({
  controllers: [MenuUsersController],
  providers: [MenuUsersService],
})
export class MenuUsersModule {}
