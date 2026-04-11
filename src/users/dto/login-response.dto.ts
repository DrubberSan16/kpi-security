import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: '1d' })
  expiresIn: string;

  @ApiProperty({
    example: {
      id: 'uuid',
      nameUser: 'dsanchez',
      nameSurname: 'Drubber Sanchez',
      email: 'demo@empresa.com',
      roleId: 'uuid-role',
      reportes: ['dashboard_ejecutivo'],
      effectiveReportes: ['dashboard_ejecutivo'],
      sucursales: ['uuid-sucursal'],
      effectiveSucursales: [{ id: 'uuid-sucursal', codigo: 'MAT', nombre: 'Matriz' }],
      allSucursales: false,
      role: { id: 'uuid-role', nombre: 'Administrador', reportes: [] },
    },
  })
  user: Record<string, unknown>;
}
