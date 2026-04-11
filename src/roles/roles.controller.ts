import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiBearerAuth('jwt')
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findAll(@Query('includeDeleted') includeDeleted?: string, @Req() req?: any) {
    return this.service.findAll(includeDeleted === 'true', req?.user?.roleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req?: any) {
    return this.service.findOne(id, req?.user?.roleId);
  }

  @Post()
  create(@Body() dto: CreateRoleDto, @Req() req?: any) {
    return this.service.create(dto, req?.user?.roleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req?: any) {
    return this.service.update(id, dto, req?.user?.roleId);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deletedBy', required: false, type: String })
  remove(@Param('id') id: string, @Query('deletedBy') deletedBy?: string, @Req() req?: any) {
    return this.service.remove(id, deletedBy, req?.user?.roleId);
  }
}
