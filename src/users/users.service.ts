import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { TbUser } from '../database/entities/tb-user.entity';
import { TbRole } from '../database/entities/tb-role.entity';
import { TbUserSucursal } from '../database/entities/tb-user-sucursal.entity';
import { InventorySucursal } from '../database/entities/inventory-sucursal.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { isSuperAdministratorRoleName } from '../common/utils/role-visibility.util';

type SucursalSummary = {
  id: string;
  codigo: string;
  nombre: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(TbUser)
    private readonly userRepo: Repository<TbUser>,
    @InjectRepository(TbRole)
    private readonly roleRepo: Repository<TbRole>,
    @InjectRepository(TbUserSucursal)
    private readonly userSucursalRepo: Repository<TbUserSucursal>,
    @InjectRepository(InventorySucursal)
    private readonly sucursalRepo: Repository<InventorySucursal>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get saltRounds(): number {
    const v = Number(this.config.get('BCRYPT_SALT_ROUNDS') || 10);
    return Number.isFinite(v) && v >= 8 ? v : 10;
  }

  private normalizeReportes(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  private normalizeSucursales(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  private async isRequesterSuperAdmin(requesterRoleId?: string | null) {
    if (!requesterRoleId) return false;
    const requesterRole = await this.roleRepo.findOne({
      where: { id: requesterRoleId, isDeleted: false },
      select: { id: true, nombre: true } as any,
    });
    return isSuperAdministratorRoleName(requesterRole?.nombre);
  }

  private async getActiveSucursales(): Promise<SucursalSummary[]> {
    const rows = await this.sucursalRepo.find({
      where: { isDeleted: false },
      order: { codigo: 'ASC', nombre: 'ASC' },
    });
    return rows.map((item) => ({
      id: item.id,
      codigo: String(item.codigo || '').trim(),
      nombre: String(item.nombre || '').trim(),
    }));
  }

  private async getVisibleRole(roleId: string, requesterRoleId?: string | null) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, isDeleted: false },
    });
    if (!role) {
      throw new BadRequestException('Role inválido');
    }
    if (
      isSuperAdministratorRoleName(role.nombre) &&
      !(await this.isRequesterSuperAdmin(requesterRoleId))
    ) {
      throw new BadRequestException('Role inválido');
    }
    return role;
  }

  private async hydrateUsers(users: TbUser[]) {
    if (!users.length) return [];

    const [allSucursales, rows] = await Promise.all([
      this.getActiveSucursales(),
      this.userSucursalRepo.find({
        where: { userId: In(users.map((item) => item.id)), isDeleted: false } as any,
      }),
    ]);

    const sucursalMap = new Map(allSucursales.map((item) => [item.id, item]));
    const rowsByUser = new Map<string, string[]>();
    rows.forEach((item) => {
      const list = rowsByUser.get(item.userId) ?? [];
      list.push(item.sucursalId);
      rowsByUser.set(item.userId, list);
    });

    return users.map((user) => {
      const explicitIds = [...new Set(rowsByUser.get(user.id) ?? [])];
      const effectiveSucursales = explicitIds.length
        ? explicitIds
            .map((item) => sucursalMap.get(item))
            .filter((item): item is SucursalSummary => Boolean(item))
        : allSucursales;

      return {
        ...user,
        passUser: undefined,
        sucursales: explicitIds,
        effectiveSucursales,
        allSucursales: explicitIds.length === 0,
      };
    });
  }

  private async syncUserSucursales(
    userId: string,
    sucursales: string[] | undefined,
    userName: string,
  ) {
    if (sucursales === undefined) return;

    const normalized = this.normalizeSucursales(sucursales);
    const validSucursales = normalized.length
      ? await this.sucursalRepo.find({
          where: { id: In(normalized), isDeleted: false } as any,
        })
      : [];

    if (normalized.length && validSucursales.length !== normalized.length) {
      throw new BadRequestException(
        'Una o más sucursales seleccionadas no existen o están inactivas.',
      );
    }

    const current = await this.userSucursalRepo.find({
      where: { userId, isDeleted: false },
    });

    if (current.length) {
      current.forEach((item) => {
        item.isDeleted = true;
        item.deletedAt = new Date();
        item.deletedBy = userName;
        item.updatedBy = userName;
      });
      await this.userSucursalRepo.save(current);
    }

    if (!normalized.length) return;

    const freshRows = normalized.map((sucursalId) =>
      this.userSucursalRepo.create({
        userId,
        sucursalId,
        createdBy: userName,
        updatedBy: userName,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      }),
    );
    await this.userSucursalRepo.save(freshRows);
  }

  async findAll(includeDeleted = false, requesterRoleId?: string | null) {
    const rows = await this.userRepo.find({
      where: includeDeleted ? undefined : { isDeleted: false },
      relations: ['role'],
    });

    const canSeeSuperAdmin = await this.isRequesterSuperAdmin(requesterRoleId);
    const visibleRows = canSeeSuperAdmin
      ? rows
      : rows.filter((item) => !isSuperAdministratorRoleName(item.role?.nombre));

    return this.hydrateUsers(visibleRows);
  }

  async findOne(id: string, requesterRoleId?: string | null) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User no encontrado');
    if (
      isSuperAdministratorRoleName(user.role?.nombre) &&
      !(await this.isRequesterSuperAdmin(requesterRoleId))
    ) {
      throw new NotFoundException('User no encontrado');
    }
    const [hydrated] = await this.hydrateUsers([user]);
    return hydrated;
  }

  async create(dto: CreateUserDto, requesterRoleId?: string | null) {
    const role = await this.getVisibleRole(dto.roleId, requesterRoleId);
    const hashed = await bcrypt.hash(dto.passUser, this.saltRounds);

    const entity = this.userRepo.create({
      ...dto,
      passUser: hashed,
      reportes:
        dto.reportes !== undefined
          ? this.normalizeReportes(dto.reportes)
          : this.normalizeReportes(role.reportes),
      tokenActive: null,
      updatedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    const saved = await this.userRepo.save(entity);
    await this.syncUserSucursales(saved.id, dto.sucursales, dto.createdBy ?? dto.nameUser);
    return this.findOne(saved.id, requesterRoleId);
  }

  async update(id: string, dto: UpdateUserDto, requesterRoleId?: string | null) {
    const current = await this.findOne(id, requesterRoleId);

    if (dto.roleId) {
      await this.getVisibleRole(dto.roleId, requesterRoleId);
    }

    if (dto.passUser) {
      dto.passUser = await bcrypt.hash(dto.passUser, this.saltRounds);
    }

    const payload: Partial<TbUser> = { ...dto };
    delete (payload as any).sucursales;

    if (dto.reportes !== undefined) {
      payload.reportes = this.normalizeReportes(dto.reportes);
    }

    await this.userRepo.update({ id }, payload);
    await this.syncUserSucursales(
      id,
      dto.sucursales,
      dto.updatedBy ?? dto.createdBy ?? current.nameUser,
    );
    return this.findOne(id, requesterRoleId);
  }

  async remove(id: string, deletedBy?: string, requesterRoleId?: string | null) {
    const user = (await this.findOne(id, requesterRoleId)) as TbUser;
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = deletedBy ?? null;
    user.status = 'INACTIVE';
    return this.userRepo.save(user);
  }

  async getSucursalesCatalog() {
    return this.getActiveSucursales();
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passUser')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.nameUser = :nameUser', { nameUser: dto.nameUser })
      .getOne();

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (String(user.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const ok = await bcrypt.compare(dto.passUser, user.passUser);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') || '1d';
    const [hydratedUser] = await this.hydrateUsers([user]);

    const payload = {
      sub: user.id,
      nameUser: user.nameUser,
      roleId: user.roleId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    user.tokenActive = accessToken;
    await this.userRepo.save(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: hydratedUser.id,
        nameUser: hydratedUser.nameUser,
        nameSurname: hydratedUser.nameSurname,
        email: hydratedUser.email,
        roleId: hydratedUser.roleId,
        reportes: this.normalizeReportes(hydratedUser.reportes),
        effectiveReportes: this.normalizeReportes(hydratedUser.reportes).length
          ? this.normalizeReportes(hydratedUser.reportes)
          : this.normalizeReportes(user.role?.reportes),
        sucursales: hydratedUser.sucursales ?? [],
        effectiveSucursales: hydratedUser.effectiveSucursales ?? [],
        allSucursales: Boolean(hydratedUser.allSucursales),
        role: user.role
          ? {
              id: user.role.id,
              nombre: user.role.nombre,
              reportes: this.normalizeReportes(user.role.reportes),
            }
          : null,
      },
    };
  }
}
