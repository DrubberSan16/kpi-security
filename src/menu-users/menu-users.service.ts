import { Injectable } from '@nestjs/common';
import { CreateMenuUserDto } from './dto/create-menu-user.dto';
import { UpdateMenuUserDto } from './dto/update-menu-user.dto';

@Injectable()
export class MenuUsersService {
  create(createMenuUserDto: CreateMenuUserDto) {
    return 'This action adds a new menuUser';
  }

  findAll() {
    return `This action returns all menuUsers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menuUser`;
  }

  update(id: number, updateMenuUserDto: UpdateMenuUserDto) {
    return `This action updates a #${id} menuUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} menuUser`;
  }
}
