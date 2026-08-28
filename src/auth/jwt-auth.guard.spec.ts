import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ALLOW_INTERNAL_SERVICE_KEY } from './internal-service.decorator';

describe('JwtAuthGuard internal service authentication', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createContext = (token?: string) => ({
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({
      getRequest: () => ({
        headers: token ? { 'x-internal-service-token': token } : {},
      }),
    }),
  });

  const createGuard = (options: {
    isPublic?: boolean;
    allowInternal?: boolean;
    configuredToken?: string;
  }) => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return options.isPublic ?? false;
        if (key === ALLOW_INTERNAL_SERVICE_KEY) {
          return options.allowInternal ?? false;
        }
        return false;
      }),
    } as unknown as Reflector;
    const config = {
      get: jest.fn(() => options.configuredToken ?? ''),
    } as unknown as ConfigService;
    return new JwtAuthGuard(reflector, config);
  };

  it('permite un token interno válido únicamente en una ruta habilitada', () => {
    const guard = createGuard({
      allowInternal: true,
      configuredToken: 'token-interno-seguro',
    });
    const parentCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate',
    );

    expect(
      guard.canActivate(createContext('token-interno-seguro')),
    ).toBe(true);
    expect(parentCanActivate).not.toHaveBeenCalled();
  });

  it('delega al JWT cuando el token interno es incorrecto', () => {
    const guard = createGuard({
      allowInternal: true,
      configuredToken: 'token-interno-seguro',
    });
    const parentCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue('jwt' as any);

    expect(guard.canActivate(createContext('token-incorrecto'))).toBe('jwt');
    expect(parentCanActivate).toHaveBeenCalledTimes(1);
  });

  it('no acepta el token interno en rutas que no lo habilitan', () => {
    const guard = createGuard({
      allowInternal: false,
      configuredToken: 'token-interno-seguro',
    });
    const parentCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue('jwt' as any);

    expect(
      guard.canActivate(createContext('token-interno-seguro')),
    ).toBe('jwt');
    expect(parentCanActivate).toHaveBeenCalledTimes(1);
  });
});
