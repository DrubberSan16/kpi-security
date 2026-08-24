import { MenusService } from './menus.service';

const createRepoMock = () => ({
  createQueryBuilder: jest.fn(),
  create: jest.fn((value: any) => value),
  save: jest.fn(async (value: any) => value),
  findOne: jest.fn(),
  metadata: { columns: [] },
});

type RepoMock = ReturnType<typeof createRepoMock>;

const buildQueryBuilderMock = (result: any) => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(result),
});

describe('MenusService ensureDefaultMenus', () => {
  let repo: RepoMock;
  let service: MenusService;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = createRepoMock();
    service = new MenusService(repo as any);
  });

  it('crea el menu "Reservas de bodega" cuando el padre Inventario existe y el menu aun no existe', async () => {
    const parent = { id: 'inventario-id', nombre: 'Inventario', isDeleted: false };
    repo.createQueryBuilder
      .mockReturnValueOnce(buildQueryBuilderMock(parent) as any)
      .mockReturnValueOnce(buildQueryBuilderMock(null) as any);

    await service.ensureDefaultMenus();

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Reservas de bodega',
        menuId: 'inventario-id',
        urlComponent: 'reservas-bodega',
        menuPosition: '10',
        status: 'ACTIVE',
        isDeleted: false,
      }),
    );
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('no duplica el menu cuando ya existe activo y coincide con la configuracion esperada', async () => {
    const parent = { id: 'inventario-id', nombre: 'Inventario', isDeleted: false };
    const existing = {
      id: 'menu-1',
      nombre: 'Reservas de bodega',
      menuId: 'inventario-id',
      urlComponent: 'reservas-bodega',
      menuPosition: '10',
      status: 'ACTIVE',
      icon: 'mdi-clipboard-list-outline',
      isDeleted: false,
    };
    repo.createQueryBuilder
      .mockReturnValueOnce(buildQueryBuilderMock(parent) as any)
      .mockReturnValueOnce(buildQueryBuilderMock(existing) as any);

    await service.ensureDefaultMenus();

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('restaura un menu previamente eliminado logicamente con el mismo nombre en lugar de duplicarlo', async () => {
    const parent = { id: 'inventario-id', nombre: 'Inventario', isDeleted: false };
    const existing: any = {
      id: 'menu-1',
      nombre: 'Reservas de bodega',
      menuId: null,
      urlComponent: null,
      menuPosition: '99',
      status: 'INACTIVE',
      icon: null,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: 'someone',
    };
    repo.createQueryBuilder
      .mockReturnValueOnce(buildQueryBuilderMock(parent) as any)
      .mockReturnValueOnce(buildQueryBuilderMock(existing) as any);

    await service.ensureDefaultMenus();

    expect(existing.isDeleted).toBe(false);
    expect(existing.deletedAt).toBeNull();
    expect(existing.deletedBy).toBeNull();
    expect(existing.menuId).toBe('inventario-id');
    expect(existing.urlComponent).toBe('reservas-bodega');
    expect(existing.status).toBe('ACTIVE');
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('actualiza un menu activo pero desactualizado (padre/posicion/componente distintos) sin duplicarlo', async () => {
    const parent = { id: 'inventario-id', nombre: 'Inventario', isDeleted: false };
    const existing: any = {
      id: 'menu-1',
      nombre: 'Reservas de bodega',
      menuId: 'otro-padre',
      urlComponent: 'reservas-bodega-vieja',
      menuPosition: '3',
      status: 'ACTIVE',
      icon: 'mdi-old-icon',
      isDeleted: false,
    };
    repo.createQueryBuilder
      .mockReturnValueOnce(buildQueryBuilderMock(parent) as any)
      .mockReturnValueOnce(buildQueryBuilderMock(existing) as any);

    await service.ensureDefaultMenus();

    expect(existing.menuId).toBe('inventario-id');
    expect(existing.urlComponent).toBe('reservas-bodega');
    expect(existing.menuPosition).toBe('10');
    expect(existing.icon).toBe('mdi-clipboard-list-outline');
    expect(repo.save).toHaveBeenCalledWith(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('omite la creacion cuando no existe un menu padre Inventario activo, sin lanzar error', async () => {
    repo.createQueryBuilder.mockReturnValueOnce(buildQueryBuilderMock(null) as any);

    await expect(service.ensureDefaultMenus()).resolves.toEqual([]);

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('no rompe el arranque del modulo cuando ensureDefaultMenus falla', async () => {
    repo.createQueryBuilder.mockImplementation(() => {
      throw new Error('fallo de conexion');
    });

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
