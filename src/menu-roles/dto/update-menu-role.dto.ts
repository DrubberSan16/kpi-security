import { PartialType } from '@nestjs/swagger';
import { CreateMenuRoleDto } from './create-menu-role.dto';

export class UpdateMenuRoleDto extends PartialType(CreateMenuRoleDto) {}
