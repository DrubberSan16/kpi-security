import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { map } from 'rxjs/operators';
import { isSuperAdministratorRoleName } from './utils/role-visibility.util';

export function isRestrictedModule(value: unknown): boolean {
  const key = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return ['gemelosdigitales', 'digitaltwins', 'modelodigital'].some((token) =>
    key.includes(token),
  );
}
/** Remove both menu nodes and assignment records, including nested relations and report flags. */
export function redactRestrictedModule(value: any): any {
  if (Array.isArray(value))
    return value.map(redactRestrictedModule).filter((v) => v !== undefined);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if (
      [
        value.urlComponent,
        value.url_component,
        value.nombre,
        value.routeName,
        value.path,
        value.action,
        value.descripcion,
      ].some((v) => isRestrictedModule(v)) ||
      (value.menu && redactRestrictedModule(value.menu) === undefined)
    )
      return undefined;
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, redactRestrictedModule(item)])
        .filter(([, item]) => item !== undefined),
    );
  }
  return typeof value === 'string' && isRestrictedModule(value)
    ? undefined
    : value;
}

/** Keep restricted modules out of all administration catalogs, even with old assignments. */
@Injectable()
export class RestrictedModuleInterceptor implements NestInterceptor {
  constructor(private readonly db: DataSource) {}
  private async roleForUser(id?: string) {
    if (!id) return null;
    const [row] = await this.db.query(
      `select r.nombre from kpi_security.tb_user u
      join kpi_security.tb_role r on r.id=u.role_id where u.id=$1 and not u.is_deleted
      and not r.is_deleted and upper(u.status)='ACTIVE' and upper(r.status)='ACTIVE'`,
      [id],
    );
    return row?.nombre;
  }
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const path = String(req.path || req.url)
      .split('?')[0]
      .replace(/^\/kpi_security\//, '/');
    if (
      !/^\/(menus|menu-users|menu-roles|users|roles|log-transacts)(\/|$)/.test(
        path,
      )
    )
      return next.handle();
    const callerRole = await this.roleForUser(req.user?.userId);
    // Trusted internal menu-tree calls are authorized using the target user's CURRENT role.
    const internalTree =
      !req.user && /^\/menu-users\/tree\/by-user\//.test(path);
    const superCaller = isSuperAdministratorRoleName(
      internalTree ? await this.roleForUser(req.params?.userId) : callerRole,
    );
    const write = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    const denied = () => new NotFoundException('Recurso no encontrado');
    if (write && /^\/menus(\/|$)/.test(path)) {
      let current: any;
      if (req.params?.id && /^[0-9a-f-]{36}$/i.test(req.params.id))
        [current] = await this.db.query(
          'select nombre,url_component from kpi_security.tb_menu where id=$1',
          [req.params.id],
        );
      if (
        !superCaller &&
        [
          req.body?.nombre,
          req.body?.urlComponent,
          current?.nombre,
          current?.url_component,
        ].some(isRestrictedModule)
      )
        throw denied();
    }
    if (write && /^\/menu-(users|roles)(\/|$)/.test(path)) {
      const userAssignment = path.startsWith('/menu-users');
      let existing: any;
      if (req.params?.id && /^[0-9a-f-]{36}$/i.test(req.params.id))
        [existing] = await this.db.query(
          `select menu_id,user_id as target from kpi_security.tb_menu_user where id=$1`
            .replace('user_id', userAssignment ? 'user_id' : 'role_id')
            .replace(
              'tb_menu_user',
              userAssignment ? 'tb_menu_user' : 'tb_menu_role',
            ),
          [req.params.id],
        );
      const menuId = req.body?.menuId || existing?.menu_id;
      if (menuId) {
        const [menu] = await this.db.query(
          'select nombre,url_component from kpi_security.tb_menu where id=$1',
          [menuId],
        );
        if (
          menu &&
          [menu.nombre, menu.url_component].some(isRestrictedModule)
        ) {
          if (!superCaller) throw denied();
          const target =
            req.body?.[userAssignment ? 'userId' : 'roleId'] ||
            existing?.target;
          const targetRole = userAssignment
            ? await this.roleForUser(target)
            : (
                await this.db.query(
                  'select nombre from kpi_security.tb_role where id=$1 and not is_deleted',
                  [target],
                )
              )[0]?.nombre;
          if (!isSuperAdministratorRoleName(targetRole)) throw denied();
        }
      }
    }
    // An ordinary profile cannot acquire the hidden report flag through the generic editor.
    if (
      write &&
      Array.isArray(req.body?.reportes) &&
      /^\/(users|roles)(\/|$)/.test(path)
    ) {
      const targetRole = path.startsWith('/users')
        ? req.body.roleId
          ? (
              await this.db.query(
                'select nombre from kpi_security.tb_role where id=$1',
                [req.body.roleId],
              )
            )[0]?.nombre
          : await this.roleForUser(req.params?.id)
        : req.body.nombre ||
          (req.params?.id
            ? (
                await this.db.query(
                  'select nombre from kpi_security.tb_role where id=$1',
                  [req.params.id],
                )
              )[0]?.nombre
            : null);
      if (!superCaller || !isSuperAdministratorRoleName(targetRole))
        req.body.reportes = req.body.reportes.filter(
          (r: unknown) => !isRestrictedModule(r),
        );
    }
    return next.handle().pipe(
      map((value) => {
        if (superCaller) return value;
        const result = redactRestrictedModule(value);
        if (result === undefined) throw denied();
        return result;
      }),
    );
  }
}
