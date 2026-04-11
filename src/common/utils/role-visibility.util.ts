const SUPER_ADMIN_ROLE_NAMES = new Set([
  'SUPER ADMINISTRADOR',
  'SUPERADMINISTRADOR',
  'SUPER_ADMINISTRADOR',
  'SUPER ADMIN',
]);

export function normalizeRoleName(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function isSuperAdministratorRoleName(value: unknown): boolean {
  return SUPER_ADMIN_ROLE_NAMES.has(normalizeRoleName(value));
}
