import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TbMenuRole } from '../database/entities/tb-menu-role.entity';
import { TbRole } from '../database/entities/tb-role.entity';
import { TbMenu } from '../database/entities/tb-menu.entity';

import { CreateMenuRoleDto } from './dto/create-menu-role.dto';
import { UpdateMenuRoleDto } from './dto/update-menu-role.dto';

@Injectable()
export class MenuRolesService {
  constructor(
    @InjectRepository(TbMenuRole)
    private readonly repo: Repository<TbMenuRole>,

    @InjectRepository(TbRole)
    private readonly roleRepo: Repository<TbRole>,

    @InjectRepository(TbMenu)
    private readonly menuRepo: Repository<TbMenu>,
  ) {}

  async findAll(includeDeleted = false) {
    if (includeDeleted) {
      return this.repo.find({ relations: ['role', 'menu'] });
    }
    return this.repo.find({
      where: { isDelete: false },
      relations: ['role', 'menu'],
    });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['role', 'menu'],
    });
    if (!row) throw new NotFoundException('MenuRole no encontrado');
    return row;
  }

  async findByRole(roleId: string, includeDeleted = false) {
    if (includeDeleted) {
      return this.repo.find({
        where: { roleId },
        relations: ['menu'],
      });
    }
    return this.repo.find({
      where: { roleId, isDelete: false },
      relations: ['menu'],
    });
  }

  private async validateRefs(roleId: string, menuId: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new BadRequestException('roleId no existe');

    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new BadRequestException('menuId no existe');
  }

  async create(dto: CreateMenuRoleDto) {
    await this.validateRefs(dto.roleId, dto.menuId);

    // Evitar duplicado roleId+menuId
    const exists = await this.repo.findOne({
      where: { roleId: dto.roleId, menuId: dto.menuId },
    });

    if (exists && !exists.isDelete) {
      throw new BadRequestException('Ya existe asignación de menú para este rol');
    }

    // Si existía pero estaba eliminado -> reactivar
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
      roleId: dto.roleId,
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

  async update(id: string, dto: UpdateMenuRoleDto) {
    const current = await this.findOne(id);

    const newRoleId = dto.roleId ?? current.roleId;
    const newMenuId = dto.menuId ?? current.menuId;

    await this.validateRefs(newRoleId, newMenuId);

    // Evitar duplicados si cambias roleId/menuId
    if ((dto.roleId || dto.menuId) && (newRoleId !== current.roleId || newMenuId !== current.menuId)) {
      const duplicated = await this.repo.findOne({
        where: { roleId: newRoleId, menuId: newMenuId },
      });
      if (duplicated && duplicated.id !== id && !duplicated.isDelete) {
        throw new BadRequestException('Ya existe asignación (roleId + menuId)');
      }
    }

    const patch: Partial<TbMenuRole> = {
      ...dto,
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
