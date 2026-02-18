import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MenuUsersService } from './menu-users.service';
import { CreateMenuUserDto } from './dto/create-menu-user.dto';
import { UpdateMenuUserDto } from './dto/update-menu-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@ApiTags('Menu Users')
@Controller('menu-users')
export class MenuUsersController {
  constructor(private readonly menuUsersService: MenuUsersService) {}

  @Post()  
  create(@Body() createMenuUserDto: CreateMenuUserDto) {
    return this.menuUsersService.create(createMenuUserDto);
  }

  @Get()
  findAll() {
    return this.menuUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuUsersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuUserDto: UpdateMenuUserDto) {
    return this.menuUsersService.update(+id, updateMenuUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuUsersService.remove(+id);
  }
}
