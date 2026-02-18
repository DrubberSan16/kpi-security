import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbMenu } from '../database/entities/tb-menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(TbMenu)
    private readonly repo: Repository<TbMenu>,
  ) {}

  findAll(includeDeleted = false) {
    if (includeDeleted) return this.repo.find({ order: { menuPosition: 'ASC' as any } });

    return this.repo.find({
      where: { isDeleted: false },
      order: { menuPosition: 'ASC' as any },
    });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Menu no encontrado');
    return row;
  }

  private async validateParent(menuId?: string, selfId?: string) {
    if (!menuId) return;

    if (selfId && menuId === selfId) {
      throw new BadRequestException('menuId no puede apuntar a sí mismo');
    }

    // Como en dump NO hay FK, validamos a nivel app si existe (opcional pero recomendado)
    const parent = await this.repo.findOne({ where: { id: menuId } });
    if (!parent) {
      throw new BadRequestException('menuId (menú padre) no existe');
    }
  }

  async create(dto: CreateMenuDto) {
    await this.validateParent(dto.menuId);

    const entity = this.repo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      menuId: dto.menuId ?? null,
      urlComponent: dto.urlComponent ?? null,
      menuPosition: dto.menuPosition,
      status: dto.status,
      icon: dto.icon ?? null,

      createdBy: dto.createdBy ?? null,
      updatedBy: null,

      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateMenuDto) {
    await this.findOne(id);
    await this.validateParent(dto.menuId, id);

    const patch: Partial<TbMenu> = {
      ...dto,
      descripcion: dto.descripcion ?? undefined,
      menuId: dto.menuId ?? undefined,
      urlComponent: dto.urlComponent ?? undefined,
      icon: dto.icon ?? undefined,
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
