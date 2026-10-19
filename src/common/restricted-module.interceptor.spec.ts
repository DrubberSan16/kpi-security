import { lastValueFrom, of } from 'rxjs';
import {
  RestrictedModuleInterceptor,
  redactRestrictedModule,
} from './restricted-module.interceptor';
describe('Catálogos sin el módulo reservado', () => {
  it('retira menús, permisos anidados y claves de reportes sin tocar los demás', () => {
    expect(
      redactRestrictedModule([
        {
          id: 'hidden',
          menu: { nombre: 'Modelo Digital', urlComponent: 'gemelos-digitales' },
        },
        {
          id: 'ordinary',
          nombre: 'Equipos',
          reportes: ['equipos', 'gemelos_digitales'],
        },
      ]),
    ).toEqual([{ id: 'ordinary', nombre: 'Equipos', reportes: ['equipos'] }]);
  });
  it('consulta el rol actual y oculta incluso el árbol de otro usuario', async () => {
    const db = {
      query: jest.fn().mockResolvedValue([{ nombre: 'Administrador' }]),
    };
    const interceptor = new RestrictedModuleInterceptor(db as any);
    const req = {
      path: '/kpi_security/menu-users/tree/by-user/other',
      method: 'GET',
      user: { userId: 'caller' },
      params: { userId: 'other' },
    };
    const result = await interceptor.intercept(
      { switchToHttp: () => ({ getRequest: () => req }) } as any,
      {
        handle: () =>
          of([
            { nombre: 'Equipos' },
            { nombre: 'Modelo Digital', urlComponent: 'gemelos-digitales' },
          ]),
      },
    );
    expect(await lastValueFrom(result)).toEqual([{ nombre: 'Equipos' }]);
  });
  it('impide asignarlo a un perfil ordinario incluso si lo intenta un Super Administrador', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ nombre: 'Super Administrador' }])
        .mockResolvedValueOnce([
          { nombre: 'Modelo Digital', url_component: 'gemelos-digitales' },
        ])
        .mockResolvedValueOnce([{ nombre: 'Técnico' }]),
    };
    const interceptor = new RestrictedModuleInterceptor(db as any);
    const req = {
      path: '/menu-roles',
      method: 'POST',
      user: { userId: 'caller' },
      body: { roleId: 'role', menuId: 'menu' },
    };
    await expect(
      interceptor.intercept(
        { switchToHttp: () => ({ getRequest: () => req }) } as any,
        { handle: () => of({}) },
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
