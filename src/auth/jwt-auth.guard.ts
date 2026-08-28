import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ALLOW_INTERNAL_SERVICE_KEY } from './internal-service.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {
    super();
  }

  private hasValidInternalServiceToken(context: any) {
    const expected = String(
      this.config.get<string>('INTERNAL_SERVICE_TOKEN') || '',
    ).trim();
    if (!expected) return false;

    const request = context.switchToHttp().getRequest();
    const rawHeader = request?.headers?.['x-internal-service-token'];
    const received = String(
      Array.isArray(rawHeader) ? rawHeader[0] : rawHeader || '',
    ).trim();
    if (!received) return false;

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }

  override canActivate(context: any) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const allowsInternalService =
      this.reflector.getAllAndOverride<boolean>(ALLOW_INTERNAL_SERVICE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (
      allowsInternalService &&
      this.hasValidInternalServiceToken(context)
    ) {
      return true;
    }

    return super.canActivate(context);
  }
}
