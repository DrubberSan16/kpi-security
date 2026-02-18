import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TbMenuUser } from '../database/entities/tb-menu-user.entity';
import { TbUser } from '../database/entities/tb-user.entity';
import { TbMenu } from '../database/entities/tb-menu.entity';

import { CreateMenuUserDto } from './dto/create-menu-user.dto';
import { UpdateMenuUserDto } from './dto/update-menu-user.dto';

@Injectable()
export class MenuUsersService {
  constructor(
    @InjectRepository(TbMenuUser)
    private readonly repo: Repository<TbMenuUser>,

    @InjectRepository(TbUser)
    private readonly userRepo: Repository<TbUser>,

    @InjectRepository(TbMenu)
    private readonly menuRepo: Repository<TbMenu>,
  ) {}

  async findAll(includeDeleted = false) {
    if (includeDeleted) {
      return this.repo.find({ relations: ['user', 'menu'] });
    }
    return this.repo.find({
      where: { isDelete: false },
      relations: ['user', 'menu'],
    });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['user', 'menu'],
    });
    if (!row) throw new NotFoundException('MenuUser no encontrado');
    return row;
  }

  async findByUser(userId: string, includeDeleted = false) {
    if (includeDeleted) {
      return this.repo.find({
        where: { userId },
        relations: ['menu'],
      });
    }
    return this.repo.find({
      where: { userId, isDelete: false },
      relations: ['menu'],
    });
  }

  private async validateRefs(userId: string, menuId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('userId no existe');

    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new BadRequestException('menuId no existe');
  }

  async create(dto: CreateMenuUserDto) {
    await this.validateRefs(dto.userId, dto.menuId);

    // Evitar duplicado userId+menuId
    const exists = await this.repo.findOne({
      where: { userId: dto.userId, menuId: dto.menuId },
    });

    // Si existe y está activo -> error
    if (exists && !exists.isDelete) {
      throw new BadRequestException('Ya existe asignación de menú para este usuario');
    }

    // Si existe pero estaba eliminado -> reactivar y actualizar permisos
    if (exists && exists.isDelete) {
      exists.isDelete = false;
      exists.deletedAt = null;
      exists.deletedBy = null;

      exists.status = dto.status;
      exists.updatedBy = dto.createdBy ?? null;

      exists.isReaded = dto.isReaded ?? exists.isReaded ?? null;
      exists.isCreated = dto.isCreated ?? exists.isCreated ?? null;
      exists.isEdited = dto.isEdited ?? exists.isEdited ?? null;
      exists.permitDeleted = dto.permitDeleted ?? exists.permitDeleted ?? null;
      exists.isReports = dto.isReports ?? exists.isReports ?? null;
      exists.reportsPermit = dto.reportsPermit ?? exists.reportsPermit ?? null;

      return this.repo.save(exists);
    }

    const entity = this.repo.create({
      userId: dto.userId,
      menuId: dto.menuId,
      status: dto.status,

      createdBy: dto.createdBy ?? null,
      updatedBy: null,

      isDelete: false,
      deletedAt: null,
      deletedBy: null,

      isReaded: dto.isReaded ?? null,
      isCreated: dto.isCreated ?? null,
      isEdited: dto.isEdited ?? null,
      permitDeleted: dto.permitDeleted ?? null,
      isReports: dto.isReports ?? null,
      reportsPermit: dto.reportsPermit ?? null,
    });

    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateMenuUserDto) {
    const current = await this.findOne(id);

    // Si cambian IDs, validar
    const newUserId = dto.userId ?? current.userId;
    const newMenuId = dto.menuId ?? current.menuId;
    await this.validateRefs(newUserId, newMenuId);

    // Evitar que el update genere duplicados (si cambias userId/menuId)
    if ((dto.userId || dto.menuId) && (newUserId !== current.userId || newMenuId !== current.menuId)) {
      const duplicated = await this.repo.findOne({
        where: { userId: newUserId, menuId: newMenuId },
      });
      if (duplicated && duplicated.id !== id && !duplicated.isDelete) {
        throw new BadRequestException('Ya existe asignación (userId + menuId)');
      }
    }

    const patch: Partial<TbMenuUser> = {
      ...dto,
      // map permitDeleted if present
      permitDeleted: dto.permitDeleted ?? undefined,
      reportsPermit: dto.reportsPermit ?? undefined,
    };

    await this.repo.update({ id }, patch);
    return this.findOne(id);
  }

  async remove(id: string, deletedBy?: string) {
    const row = await this.findOne(id);

    row.isDelete = true;
    row.deletedAt = new Date();
    row.deletedBy = deletedBy ?? null;

    return this.repo.save(row);
  }
}
