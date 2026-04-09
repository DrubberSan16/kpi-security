import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { TbUser } from '../database/entities/tb-user.entity';
import { TbRole } from '../database/entities/tb-role.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(TbUser)
    private readonly userRepo: Repository<TbUser>,
    @InjectRepository(TbRole)
    private readonly roleRepo: Repository<TbRole>,
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

  async findAll(includeDeleted = false) {
    if (includeDeleted) return this.userRepo.find({ relations: ['role'] });

    return this.userRepo.find({
      where: { isDeleted: false },
      relations: ['role'],
    });
  }

  async findOne(id: string) {
    let user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });    
    if (!user) throw new NotFoundException('User no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new BadRequestException('Role inválido');

    // ✅ Hash de contraseña
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

    return this.userRepo.save(entity);
  }

  async update(id: string, dto: UpdateUserDto) {
    const current = await this.findOne(id);

    if (dto.roleId) {
      const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (!role) throw new BadRequestException('Role inválido');
    }

    // ✅ Si llega passUser, re-hashear
    if (dto.passUser) {
      dto.passUser = await bcrypt.hash(dto.passUser, this.saltRounds);
    }

    const payload: Partial<TbUser> = { ...dto };
    if (dto.reportes !== undefined) {
      payload.reportes = this.normalizeReportes(dto.reportes);
    }
    await this.userRepo.update({ id }, payload);
    return this.findOne(id);
  }

  async remove(id: string, deletedBy?: string) {
    const user = await this.findOne(id);
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = deletedBy ?? null;
    user.status = "INACTIVE";
    return this.userRepo.save(user);
  }

  /**
   * ✅ Login + JWT
   * - valida usuario activo (status) y no borrado
   * - compara contraseña con bcrypt
   * - genera JWT
   * - opcional: guarda token en token_active
   */
  async login(dto: LoginDto) {
    const user = await this.userRepo
    .createQueryBuilder('user')
    .addSelect('user.passUser') // ✅ trae el hash aunque select:false
    .leftJoinAndSelect('user.role', 'role')
    .where('user.nameUser = :nameUser', { nameUser: dto.nameUser })
    .getOne();

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // si manejas status tipo ACTIVE/INACTIVE:
    if (String(user.status || '').toUpperCase() !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const ok = await bcrypt.compare(dto.passUser, user.passUser);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') || '1d';

    const payload = {
      sub: user.id,
      nameUser: user.nameUser,
      roleId: user.roleId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Opcional: persistir token activo (según tu tabla tb_user.token_active)
    user.tokenActive = accessToken;
    await this.userRepo.save(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        nameUser: user.nameUser,
        nameSurname: user.nameSurname,
        email: user.email,
        roleId: user.roleId,
        reportes: this.normalizeReportes(user.reportes),
        effectiveReportes: this.normalizeReportes(user.reportes).length
          ? this.normalizeReportes(user.reportes)
          : this.normalizeReportes(user.role?.reportes),
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
