import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TbMenu } from '../database/entities/tb-menu.entity';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({
  imports: [TypeOrmModule.forFeature([TbMenu])],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
