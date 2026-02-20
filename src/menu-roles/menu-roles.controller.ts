import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

import { MenuRolesService } from './menu-roles.service';
import { CreateMenuRoleDto } from './dto/create-menu-role.dto';
import { UpdateMenuRoleDto } from './dto/update-menu-role.dto';

@ApiTags('MenuRoles')
@ApiBearerAuth('jwt')
@Controller('menu-roles')
export class MenuRolesController {
  constructor(private readonly service: MenuRolesService) { }

  @Get()
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.service.findAll(includeDeleted === 'true');
  }

  @Get('by-role/:roleId')
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findByRole(
    @Param('roleId') roleId: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.service.findByRole(roleId, includeDeleted === 'true');
  }

  @Get('tree/by-role/:roleId')
  getTreeByRole(@Param('roleId') roleId: string) {
    return this.service.getMenuTreeByRole(roleId);
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMenuRoleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMenuRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deletedBy', required: false, type: String })
  remove(@Param('id') id: string, @Query('deletedBy') deletedBy?: string) {
    return this.service.remove(id, deletedBy);
  }
}
