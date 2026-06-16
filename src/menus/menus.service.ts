import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildMenuTree } from '../utility/menu-tree.util';
import { TbMenu } from '../database/entities/tb-menu.entity';
import { TbMenuRole } from '../database/entities/tb-menu-role.entity';
import { TbMenuUser } from '../database/entities/tb-menu-user.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { normalizeTimestampPayload } from '../common/utils/local-timestamp.util';
import { isSuperAdministratorRoleName } from '../common/utils/role-visibility.util';

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);

  constructor(
    @InjectRepository(TbMenu)
    private readonly repo: Repository<TbMenu>,
  ) {}

  private assertCanPurge(roleName?: string) {
    if (isSuperAdministratorRoleName(roleName)) return;
    throw new ForbiddenException(
      'Solo el Super Administrador puede ejecutar eliminacion real masiva.',
    );
  }

  async findAll(includeDeleted = false) {
    const menus = await this.repo.find({
      where: includeDeleted ? {} : { isDeleted: false },
      order: { menuPosition: 'ASC' as any },
    });

    const nodes = menus.map((m: TbMenu) => ({
      id: m.id,
      parentId: m.menuId,
      nombre: m.nombre,
      descripcion: m.descripcion,
      icon: m.icon,
      urlComponent: m.urlComponent,
      menuPosition: m.menuPosition,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      createdBy: m.createdBy,
      updatedBy: m.updatedBy,
      isDeleted: m.isDeleted,
      deletedAt: m.deletedAt,
      deletedBy: m.deletedBy,
    }));

    return buildMenuTree(nodes);
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Menu no encontrado');
    return row;
  }

  private normalizeRequiredText(value: unknown, fieldLabel: string) {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldLabel} es obligatorio`);
    }
    return normalized;
  }

  private normalizeNullableText(value: unknown) {
    const normalized = String(value ?? '').trim();
    return normalized || null;
  }

  private async findMenuByNormalizedName(nombre: string, excludeId?: string) {
    const qb = this.repo
      .createQueryBuilder('menu')
      .where('LOWER(TRIM(menu.nombre)) = LOWER(TRIM(:nombre))', { nombre });

    if (excludeId) {
      qb.andWhere('menu.id <> :excludeId', { excludeId });
    }

    return qb
      .orderBy('menu.isDeleted', 'ASC')
      .addOrderBy('menu.updatedAt', 'DESC')
      .addOrderBy('menu.createdAt', 'DESC')
      .getOne();
  }

  private handlePersistenceError(action: string, error: unknown): never {
    const anyError = error as any;
    const message =
      String(
        anyError?.driverError?.detail ||
          anyError?.driverError?.message ||
          anyError?.message ||
          'desconocido',
      ).trim() || 'desconocido';
    const code = String(
      anyError?.driverError?.code || anyError?.code || '',
    ).trim();
    const constraint = String(
      anyError?.driverError?.constraint || anyError?.constraint || '',
    ).trim();

    this.logger.error(
      `Menu ${action} error: ${message}`,
      anyError?.stack || undefined,
    );

    if (code === '23505' && /tb_menu_nombre_key/i.test(constraint)) {
      throw new ConflictException(
        'Ya existe un menu con ese nombre. Si fue eliminado previamente, debe reactivarse en lugar de crearlo de nuevo.',
      );
    }

    throw new InternalServerErrorException('No se pudo guardar el menu.');
  }

  private async validateParent(menuId?: string, selfId?: string) {
    if (!menuId) return;

    if (selfId && menuId === selfId) {
      throw new BadRequestException('menuId no puede apuntar a si mismo');
    }

    const parent = await this.repo.findOne({
      where: { id: menuId, isDeleted: false },
    });
    if (!parent) {
      throw new BadRequestException(
        'menuId (menu padre) no existe o se encuentra eliminado',
      );
    }
  }

  async create(dto: CreateMenuDto) {
    await this.validateParent(dto.menuId);

    const nombre = this.normalizeRequiredText(dto.nombre, 'nombre');
    const existingByName = await this.findMenuByNormalizedName(nombre);

    if (existingByName && !existingByName.isDeleted) {
      throw new ConflictException('Ya existe un menu activo con ese nombre');
    }

    if (existingByName?.isDeleted) {
      existingByName.nombre = nombre;
      existingByName.descripcion = this.normalizeNullableText(dto.descripcion);
      existingByName.menuId = dto.menuId ?? null;
      existingByName.urlComponent = this.normalizeNullableText(dto.urlComponent);
      existingByName.menuPosition = this.normalizeRequiredText(
        dto.menuPosition,
        'menuPosition',
      );
      existingByName.status = this.normalizeRequiredText(dto.status, 'status');
      existingByName.icon = this.normalizeNullableText(dto.icon);
      existingByName.updatedBy = this.normalizeNullableText(dto.createdBy);
      existingByName.isDeleted = false;
      existingByName.deletedAt = null;
      existingByName.deletedBy = null;

      try {
        return await this.repo.save(existingByName);
      } catch (error) {
        this.handlePersistenceError('restore/create', error);
      }
    }

    const entity = this.repo.create(normalizeTimestampPayload(this.repo, {
      nombre,
      descripcion: this.normalizeNullableText(dto.descripcion),
      menuId: dto.menuId ?? null,
      urlComponent: this.normalizeNullableText(dto.urlComponent),
      menuPosition: this.normalizeRequiredText(
        dto.menuPosition,
        'menuPosition',
      ),
      status: this.normalizeRequiredText(dto.status, 'status'),
      icon: this.normalizeNullableText(dto.icon),
      createdBy: this.normalizeNullableText(dto.createdBy),
      updatedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    }));

    try {
      return await this.repo.save(entity);
    } catch (error) {
      this.handlePersistenceError('create', error);
    }
  }

  async update(id: string, dto: UpdateMenuDto) {
    const row = await this.findOne(id);
    await this.validateParent(dto.menuId, id);

    if (dto.nombre !== undefined) {
      const nombre = this.normalizeRequiredText(dto.nombre, 'nombre');
      const existingByName = await this.findMenuByNormalizedName(nombre, id);
      if (existingByName && !existingByName.isDeleted) {
        throw new ConflictException('Ya existe un menu activo con ese nombre');
      }
      if (existingByName?.isDeleted) {
        throw new ConflictException(
          'Existe un menu eliminado con ese nombre. Reutiliza ese menu o cambia el nombre.',
        );
      }
      row.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      row.descripcion = this.normalizeNullableText(dto.descripcion);
    }
    if (dto.menuId !== undefined) {
      row.menuId = dto.menuId ?? null;
    }
    if (dto.urlComponent !== undefined) {
      row.urlComponent = this.normalizeNullableText(dto.urlComponent);
    }
    if (dto.menuPosition !== undefined) {
      row.menuPosition = this.normalizeRequiredText(
        dto.menuPosition,
        'menuPosition',
      );
    }
    if (dto.status !== undefined) {
      row.status = this.normalizeRequiredText(dto.status, 'status');
    }
    if (dto.icon !== undefined) {
      row.icon = this.normalizeNullableText(dto.icon);
    }
    row.updatedBy = this.normalizeNullableText(dto.createdBy) ?? row.updatedBy;

    try {
      return await this.repo.save(row);
    } catch (error) {
      this.handlePersistenceError('update', error);
    }
  }

  async remove(id: string, deletedBy?: string) {
    const row = await this.findOne(id);

    row.isDeleted = true;
    row.deletedAt = new Date();
    row.deletedBy = deletedBy ?? null;

    try {
      return await this.repo.save(row);
    } catch (error) {
      this.handlePersistenceError('delete', error);
    }
  }

  async purgeAll(roleName?: string) {
    this.assertCanPurge(roleName);
    const result = await this.repo.manager.transaction(async (manager) => {
      const menuUsers = await manager
        .createQueryBuilder()
        .delete()
        .from(TbMenuUser)
        .execute();
      const menuRoles = await manager
        .createQueryBuilder()
        .delete()
        .from(TbMenuRole)
        .execute();
      const menus = await manager
        .createQueryBuilder()
        .delete()
        .from(TbMenu)
        .execute();

      return {
        menu_users: Number(menuUsers.affected || 0),
        menu_roles: Number(menuRoles.affected || 0),
        menus: Number(menus.affected || 0),
      };
    });

    return {
      message: `Eliminacion real masiva ejecutada correctamente (${result.menus} menus).`,
      affected: result.menus,
      details: result,
    };
  }
}
