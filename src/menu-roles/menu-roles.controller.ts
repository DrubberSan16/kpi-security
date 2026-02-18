import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MenuRolesService } from './menu-roles.service';
import { CreateMenuRoleDto } from './dto/create-menu-role.dto';
import { UpdateMenuRoleDto } from './dto/update-menu-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Menu Roles')
@ApiBearerAuth('jwt')
@Controller('menu-roles')
export class MenuRolesController {
  constructor(private readonly menuRolesService: MenuRolesService) {}

  @Post()  
  create(@Body() createMenuRoleDto: CreateMenuRoleDto) {
    return this.menuRolesService.create(createMenuRoleDto);
  }

  @Get()  
  findAll() {
    return this.menuRolesService.findAll();
  }

  @Get(':id')  
  findOne(@Param('id') id: string) {
    return this.menuRolesService.findOne(+id);
  }

  @Patch(':id')  
  update(@Param('id') id: string, @Body() updateMenuRoleDto: UpdateMenuRoleDto) {
    return this.menuRolesService.update(+id, updateMenuRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuRolesService.remove(+id);
  }
}
