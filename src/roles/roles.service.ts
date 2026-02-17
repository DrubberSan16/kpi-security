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
    await this.repo.update({ id }, { ...dto, updatedBy: (dto as any).updatedBy ?? null });
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
