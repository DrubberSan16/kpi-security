import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

          autoLoadEntities: true,
          synchronize: false, // recomendado en server
          logging: false,

          // Para Postgres remoto (RDS/managed), activa si aplica:
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class AppModule {}
