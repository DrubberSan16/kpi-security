import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbRole } from '../database/entities/tb-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { isSuperAdministratorRoleName } from '../common/utils/role-visibility.util';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(TbRole)
    private readonly repo: Repository<TbRole>,
  ) {}

  private normalizeReportes(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  private async isRequesterSuperAdmin(requesterRoleId?: string | null) {
    if (!requesterRoleId) return false;
    const requesterRole = await this.repo.findOne({
      where: { id: requesterRoleId, isDeleted: false },
      select: { id: true, nombre: true } as any,
    });
    return isSuperAdministratorRoleName(requesterRole?.nombre);
  }

  private async assertCanManageSuperAdminRole(
    requesterRoleId?: string | null,
    roleName?: string | null,
  ) {
    if (!isSuperAdministratorRoleName(roleName)) return;
    if (await this.isRequesterSuperAdmin(requesterRoleId)) return;
    throw new NotFoundException('Role no encontrado');
  }

  async findAll(includeDeleted = false, requesterRoleId?: string | null) {
    const rows = includeDeleted
      ? await this.repo.find()
      : await this.repo.find({ where: { isDeleted: false } });

    if (await this.isRequesterSuperAdmin(requesterRoleId)) {
      return rows;
    }

    return rows.filter((row) => !isSuperAdministratorRoleName(row.nombre));
  }

  async findOne(id: string, requesterRoleId?: string | null) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Role no encontrado');
    await this.assertCanManageSuperAdminRole(requesterRoleId, row.nombre);
    return row;
  }

  async create(dto: CreateRoleDto, requesterRoleId?: string | null) {
    await this.assertCanManageSuperAdminRole(requesterRoleId, dto.nombre);
    const entity = this.repo.create({
      ...dto,
      reportes: this.normalizeReportes(dto.reportes),
      createdBy: dto.createdBy ?? null,
      updatedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateRoleDto, requesterRoleId?: string | null) {
    const current = await this.findOne(id, requesterRoleId);
    await this.assertCanManageSuperAdminRole(
      requesterRoleId,
      dto.nombre ?? current.nombre,
    );

    const payload: Partial<TbRole> = {
      ...dto,
      updatedBy: (dto as any).updatedBy ?? null,
    };
    if (dto.reportes !== undefined) {
      payload.reportes = this.normalizeReportes(dto.reportes);
    }
    await this.repo.update({ id }, payload);
    return this.findOne(id, requesterRoleId);
  }

  async remove(id: string, deletedBy?: string, requesterRoleId?: string | null) {
    const row = await this.findOne(id, requesterRoleId);
    row.isDeleted = true;
    row.deletedAt = new Date();
    row.deletedBy = deletedBy ?? null;
    return this.repo.save(row);
  }
}
