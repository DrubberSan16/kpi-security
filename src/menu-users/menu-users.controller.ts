import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

import { MenuUsersService } from './menu-users.service';
import { CreateMenuUserDto } from './dto/create-menu-user.dto';
import { UpdateMenuUserDto } from './dto/update-menu-user.dto';

@ApiTags('MenuUsers')
@ApiBearerAuth('jwt')
@Controller('menu-users')
export class MenuUsersController {
  constructor(private readonly service: MenuUsersService) {}

  @Get()
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.service.findAll(includeDeleted === 'true');
  }

  @Get('by-user/:userId')
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findByUser(
    @Param('userId') userId: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.service.findByUser(userId, includeDeleted === 'true');
  }

  @Get('tree/by-user/:userId')  
  async findTreeByUser(
    @Param('userId') userId: string    
  ) {
    return await this.service.getMenuTreeByUser(userId);    
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMenuUserDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMenuUserDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deletedBy', required: false, type: String })
  remove(@Param('id') id: string, @Query('deletedBy') deletedBy?: string) {
    return this.service.remove(id, deletedBy);
  }
}
