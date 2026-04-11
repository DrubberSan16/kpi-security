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
import { ApiTags, ApiQuery, ApiOkResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from 'src/auth/public.decorator';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findAll(@Query('includeDeleted') includeDeleted?: string, @Req() req?: any) {
    return this.service.findAll(includeDeleted === 'true', req?.user?.roleId);
  }

  @Get('sucursales/catalogo')
  getSucursalesCatalog() {
    return this.service.getSucursalesCatalog();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req?: any) {
    return this.service.findOne(id, req?.user?.roleId);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req?: any) {
    return this.service.create(dto, req?.user?.roleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req?: any) {
    return this.service.update(id, dto, req?.user?.roleId);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deletedBy', required: false, type: String })
  remove(@Param('id') id: string, @Query('deletedBy') deletedBy?: string, @Req() req?: any) {
    return this.service.remove(id, deletedBy, req?.user?.roleId);
  }

  @Public()
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
}
