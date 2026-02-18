import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'CHANGE_ME',
    });
  }

  async validate(payload: any) {
    // payload viene del sign: { sub, nameUser, roleId, ... }
    return {
      userId: payload.sub,
      nameUser: payload.nameUser,
      roleId: payload.roleId,
    };
  }
}
