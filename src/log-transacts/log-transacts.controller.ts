import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LogTransactsService } from './log-transacts.service';
import { CreateLogTransactDto } from './dto/create-log-transact.dto';
import { UpdateLogTransactDto } from './dto/update-log-transact.dto';

@Controller('log-transacts')
export class LogTransactsController {
  constructor(private readonly logTransactsService: LogTransactsService) {}

  @Post()
  create(@Body() createLogTransactDto: CreateLogTransactDto) {
    return this.logTransactsService.create(createLogTransactDto);
  }

  @Get()
  findAll() {
    return this.logTransactsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logTransactsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogTransactDto: UpdateLogTransactDto) {
    return this.logTransactsService.update(+id, updateLogTransactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logTransactsService.remove(+id);
  }
}
