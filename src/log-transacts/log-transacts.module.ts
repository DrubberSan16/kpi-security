import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TbLogTransact } from '../database/entities/tb-log-transact.entity';
import { LogTransactsController } from './log-transacts.controller';
import { LogTransactsService } from './log-transacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([TbLogTransact])],
  controllers: [LogTransactsController],
  providers: [LogTransactsService],
})
export class LogTransactsModule {}
