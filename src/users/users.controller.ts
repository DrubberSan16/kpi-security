import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiQuery, ApiOkResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from 'src/auth/public.decorator';
import { AllowInternalService } from 'src/auth/internal-service.decorator';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findAll(@Query('includeDeleted') includeDeleted?: string, @Req() req?: any) {
    return this.service.findAll(
      includeDeleted === 'true',
      req?.user?.roleId,
      req?.user?.userId,
    );
  }

  @Get('sucursales/catalogo')
  getSucursalesCatalog(@Req() req?: any) {
    return this.service.getSucursalesCatalog(req?.user?.roleId, req?.user?.userId);
  }

  @Get('session/validate')
  @AllowInternalService()
  validateSession(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const internal = !req?.user;
    const user = internal
      ? {
          userId: req?.headers?.['x-user-id'] ?? null,
          nameUser: req?.headers?.['x-user-name'] ?? null,
          email: req?.headers?.['x-user-email'] ?? null,
          nameSurname: req?.headers?.['x-user-display-name'] ?? null,
          roleName: req?.headers?.['x-role-name'] ?? null,
          roleId: null,
        }
      : req.user;

    const responseHeaders: Record<string, unknown> = {
      'X-Authenticated-User-Id': user?.userId,
      'X-Authenticated-User-Name': user?.nameUser,
      'X-Authenticated-User-Email': user?.email,
      'X-Authenticated-User-Display-Name': user?.nameSurname,
      'X-Authenticated-Role-Name': user?.roleName,
      'X-Authenticated-Internal': internal ? 'true' : 'false',
    };
    for (const [name, value] of Object.entries(responseHeaders)) {
      if (value !== undefined && value !== null && String(value).trim()) {
        res.setHeader(name, String(value));
      }
    }

    return { valid: true, internal, user };
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req?: any) {
    return this.service.findOne(id, req?.user?.roleId, req?.user?.userId);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req?: any) {
    return this.service.create(dto, req?.user?.roleId, req?.user?.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req?: any) {
    return this.service.update(id, dto, req?.user?.roleId, req?.user?.userId);
  }

  @Delete('purge-all')
  purgeAll(@Headers('x-role-name') roleName?: string) {
    return this.service.purgeAll(roleName);
  }

  @Delete(':id')
  @ApiQuery({ name: 'deletedBy', required: false, type: String })
  remove(@Param('id') id: string, @Query('deletedBy') deletedBy?: string, @Req() req?: any) {
    return this.service.remove(id, deletedBy, req?.user?.roleId, req?.user?.userId);
  }

  @Public()
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
}
