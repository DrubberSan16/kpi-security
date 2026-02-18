import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { MenusModule } from './menus/menus.module';
import { MenuRolesModule } from './menu-roles/menu-roles.module';
import { MenuUsersModule } from './menu-users/menu-users.module';
import { LogTransactsModule } from './log-transacts/log-transacts.module';
import { ENTITIES } from './database/entities';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sslEnabled = String(config.get('DB_SSL') || 'false') === 'true';

        return {
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: Number(config.get('DB_PORT') || 5432),
          username: config.get('DB_USER'),
          password: config.get('DB_PASS'),
          database: config.get('DB_NAME'),
          schema: 'kpi_security',
          entities: ENTITIES,
          autoLoadEntities: false,
          synchronize: false, // recomendado en server
          logging: false,
          // Para Postgres remoto (RDS/managed), activa si aplica:
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          extra: {
            options: '-c timezone=UTC'
          }
        };
      },
    }),
    RolesModule,
    UsersModule,
    MenusModule,
    MenuRolesModule,
    MenuUsersModule,
    LogTransactsModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
