import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TbLogTransact } from '../database/entities/tb-log-transact.entity';
import { CreateLogTransactDto } from './dto/create-log-transact.dto';
import { UpdateLogTransactDto } from './dto/update-log-transact.dto';

type FindAllFilters = {
  includeDeleted?: boolean;
  moduleMicroservice?: string;
  typeLog?: string;
  status?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
};

@Injectable()
export class LogTransactsService {
  constructor(
    @InjectRepository(TbLogTransact)
    private readonly repo: Repository<TbLogTransact>,
  ) {}

  async findAll(filters: FindAllFilters = {}) {
    const qb = this.repo.createQueryBuilder('l');

    if (!filters.includeDeleted) {
      qb.andWhere('l.isDeleted = false');
    }

    if (filters.moduleMicroservice) {
      qb.andWhere('l.moduleMicroservice ILIKE :m', { m: `%${filters.moduleMicroservice}%` });
    }

    if (filters.typeLog) {
      qb.andWhere('l.typeLog ILIKE :t', { t: `%${filters.typeLog}%` });
    }

    if (filters.status) {
      qb.andWhere('l.status = :s', { s: filters.status });
    }

    if (filters.from) {
      qb.andWhere('l.createdAt >= :from', { from: new Date(filters.from) });
    }

    if (filters.to) {
      qb.andWhere('l.createdAt <= :to', { to: new Date(filters.to) });
    }

    qb.orderBy('l.createdAt', 'DESC');

    return qb.getMany();
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('LogTransact no encontrado');
    return row;
  }

  async create(dto: CreateLogTransactDto) {
    const entity = this.repo.create({
      moduleMicroservice: dto.moduleMicroservice,
      typeLog: dto.typeLog ?? null,
      description: dto.description ?? null,
      status: dto.status,

      createdBy: dto.createdBy ?? null,
      updatedBy: null,

      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateLogTransactDto) {
    await this.findOne(id);

    const patch: Partial<TbLogTransact> = {
      ...dto,
      typeLog: dto.typeLog ?? undefined,
      description: dto.description ?? undefined,
    };

    await this.repo.update({ id }, patch);
    return this.findOne(id);
  }

  async remove(id: string, deletedBy?: string) {
    const row = await this.findOne(id);

    row.isDeleted = true;
    row.deletedAt = new Date();
    row.deletedBy = deletedBy ?? null;

    return this.repo.save(row);
  }
}
