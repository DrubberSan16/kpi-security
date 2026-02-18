import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

import { LogTransactsService } from './log-transacts.service';
import { CreateLogTransactDto } from './dto/create-log-transact.dto';
import { UpdateLogTransactDto } from './dto/update-log-transact.dto';

@ApiTags('LogTransacts')
@ApiBearerAuth('jwt')
@Controller('log-transacts')
export class LogTransactsController {
  constructor(private readonly service: LogTransactsService) {}

  @Get()
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'moduleMicroservice', required: false, type: String })
  @ApiQuery({ name: 'typeLog', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO date (>= createdAt)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO date (<= createdAt)' })
  findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('moduleMicroservice') moduleMicroservice?: string,
    @Query('typeLog') typeLog?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({
      includeDeleted: includeDeleted === 'true',
      moduleMicroservice,
      typeLog,
      status,
      from,
      to,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLogTransactDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLogTransactDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deletedBy', required: false, type: String })
  remove(@Param('id') id: string, @Query('deletedBy') deletedBy?: string) {
    return this.service.remove(id, deletedBy);
  }
}
