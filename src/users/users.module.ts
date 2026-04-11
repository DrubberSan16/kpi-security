import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TbUser } from '../database/entities/tb-user.entity';
import { TbRole } from '../database/entities/tb-role.entity';
import { TbUserSucursal } from '../database/entities/tb-user-sucursal.entity';
import { InventorySucursal } from '../database/entities/inventory-sucursal.entity';

function parseExpiresToSeconds(value?: string): number {
  if (!value) return 60 * 60 * 24; // 1d por defecto

  const v = value.trim();

  // si viene como número ("3600")
  const asNum = Number(v);
  if (Number.isFinite(asNum) && asNum > 0) return Math.floor(asNum);

  // formatos: 15m, 12h, 1d, 30s
  const m = v.match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 60 * 60 * 24;

  const n = Number(m[1]);
  const unit = m[2].toLowerCase();

  switch (unit) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 60 * 60;
    case 'd': return n * 60 * 60 * 24;
    default: return 60 * 60 * 24;
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([TbUser, TbRole, TbUserSucursal, InventorySucursal]),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET') || 'CHANGE_ME';
        const expiresRaw = config.get<string>('JWT_EXPIRES_IN') || '1d';

        return {
          secret,
          signOptions: {
            expiresIn: parseExpiresToSeconds(expiresRaw), // ✅ number
          },
        };
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
