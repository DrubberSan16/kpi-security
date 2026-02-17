import { PartialType } from '@nestjs/swagger';
import { CreateMenuUserDto } from './create-menu-user.dto';

export class UpdateMenuUserDto extends PartialType(CreateMenuUserDto) {}
