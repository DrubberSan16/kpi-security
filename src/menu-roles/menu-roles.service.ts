import { Injectable } from '@nestjs/common';
import { CreateMenuRoleDto } from './dto/create-menu-role.dto';
import { UpdateMenuRoleDto } from './dto/update-menu-role.dto';

@Injectable()
export class MenuRolesService {
  create(createMenuRoleDto: CreateMenuRoleDto) {
    return 'This action adds a new menuRole';
  }

  findAll() {
    return `This action returns all menuRoles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menuRole`;
  }

  update(id: number, updateMenuRoleDto: UpdateMenuRoleDto) {
    return `This action updates a #${id} menuRole`;
  }

  remove(id: number) {
    return `This action removes a #${id} menuRole`;
  }
}
