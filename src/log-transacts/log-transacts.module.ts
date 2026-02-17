import { Module } from '@nestjs/common';
import { LogTransactsService } from './log-transacts.service';
import { LogTransactsController } from './log-transacts.controller';

@Module({
  controllers: [LogTransactsController],
  providers: [LogTransactsService],
})
export class LogTransactsModule {}
