import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbRole } from '../database/entities/tb-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

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

  findAll(includeDeleted = false) {
    if (includeDeleted) return this.repo.find();
    return this.repo.find({ where: { isDeleted: false } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Role no encontrado');
    return row;
  }

  async create(dto: CreateRoleDto) {
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

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    const payload: Partial<TbRole> = {
      ...dto,
      updatedBy: (dto as any).updatedBy ?? null,
    };
    if (dto.reportes !== undefined) {
      payload.reportes = this.normalizeReportes(dto.reportes);
    }
    await this.repo.update({ id }, payload);
    return this.findOne(id);
  }

  // Soft delete (recomendado)
  async remove(id: string, deletedBy?: string) {
    const row = await this.findOne(id);
    row.isDeleted = true;
    row.deletedAt = new Date();
    row.deletedBy = deletedBy ?? null;
    return this.repo.save(row);
  }
}
