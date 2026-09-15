-- ---------------------------------------------------------------------------
-- Secciona el menu en seis bloques: Configuracion, Administracion,
-- Mantenimiento, Inventario, Procesos e Informes
-- ---------------------------------------------------------------------------
-- El menu mezclaba maestros de configuracion con pantallas de operacion:
-- Usuarios y Roles convivian con los tableros de Gerencia, y los maestros de
-- inventario (Sucursales, Lineas, Categorias, Unidades) estaban repartidos
-- entre Inventario y Mantenimiento segun donde se habian creado.
--
-- Ahora todo lo que se configura una vez vive en Configuracion, y cada seccion
-- de operacion queda solo con sus pantallas de trabajo.
--
-- NINGUN `url_component` cambia. Los permisos se resuelven por componente y no
-- por el nombre visible, asi que renombrar una entrada no afecta a ningun
-- control de acceso del codigo. Lo unico que se mueve es el nombre, el padre y
-- la posicion.
--
-- La trampa de siempre: `getMenuTreeByUser` arma el arbol SOLO con los menus
-- asignados al usuario y engancha por `menu_id`. Si alguien tiene el hijo pero
-- no el padre nuevo, la opcion aparece suelta en la raiz. Por eso el bloque 6
-- concede LECTURA del padre a quien tenga cualquiera de sus hijos.
--
-- Idempotente: se puede reejecutar sin duplicar filas ni degradar permisos.
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Secciones nuevas
-- ===========================================================================
-- UUID fijos para que la migracion sea reejecutable y para poder referenciarlas
-- mas abajo sin subconsultas.
INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,
  'Configuración',
  'Maestros y catalogos que se definen una vez: usuarios, roles y los catalogos de inventario y mantenimiento.',
  NULL,
  '/',
  1,
  'ACTIVE',
  'menu-secciones',
  'menu-secciones',
  false,
  'mdi-cog-outline'
WHERE NOT EXISTS (
  SELECT 1 FROM kpi_security.tb_menu m
  WHERE m.id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid
);

INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid,
  'Informes',
  'Documentacion y reporteria transversal.',
  NULL,
  '/',
  6,
  'ACTIVE',
  'menu-secciones',
  'menu-secciones',
  false,
  'mdi-file-document-multiple-outline'
WHERE NOT EXISTS (
  SELECT 1 FROM kpi_security.tb_menu m
  WHERE m.id = 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid
);

-- Si una reejecucion las encontrara retiradas, vuelven a quedar operativas.
UPDATE kpi_security.tb_menu
SET status = 'ACTIVE', is_deleted = false, deleted_at = NULL, deleted_by = NULL,
    menu_id = NULL, updated_at = now(), updated_by = 'menu-secciones'
WHERE id IN (
  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,
  'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid
);

-- ===========================================================================
-- 2. Pantallas nuevas, todavia sin contenido
-- ===========================================================================
-- Ambas apuntan al marcador "pantalla en desarrollo" del front. La ruta y el
-- permiso quedan operativos desde ya para poder ordenar el menu antes de que
-- exista el tablero.
INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid,
  'Proyectos',
  'Pantalla en desarrollo: proyectos de mantenimiento.',
  'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  -- Mantenimiento
  'proyectos',
  5,
  'ACTIVE',
  'menu-secciones',
  'menu-secciones',
  false,
  'mdi-clipboard-flow-outline'
WHERE NOT EXISTS (
  SELECT 1 FROM kpi_security.tb_menu m WHERE m.url_component = 'proyectos'
);

INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  'b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid,
  'Reportería',
  'Pantalla en desarrollo: reporteria transversal.',
  'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid,  -- Informes
  'reporteria',
  2,
  'ACTIVE',
  'menu-secciones',
  'menu-secciones',
  false,
  'mdi-chart-box-outline'
WHERE NOT EXISTS (
  SELECT 1 FROM kpi_security.tb_menu m WHERE m.url_component = 'reporteria'
);

-- ===========================================================================
-- 3. Reubicacion, renombrado y orden
-- ===========================================================================
-- Una sola sentencia por entrada, con el destino explicito. Se listan todas
-- -- incluidas las que no cambian de padre -- para dejar el orden fijado y no
-- depender de posiciones heredadas que hoy estan repetidas o en 99/100/101.
UPDATE kpi_security.tb_menu AS m
SET nombre = destino.nombre,
    menu_id = destino.padre,
    menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-secciones'
FROM (
  VALUES
    -- Configuracion
    ('b54038b5-2049-41d2-a7fa-7dd6e244a63b'::uuid, 'Usuarios',                 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  1),
    ('67207428-167c-4399-a896-97a141b27cbf'::uuid, 'Menú',                     'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  2),
    ('3a355e90-ac29-402b-8fb0-97058589c2de'::uuid, 'Roles',                    'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  3),
    ('bc5ac3a2-136a-4e47-ad48-247452c90482'::uuid, 'Sucursales',               'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  4),
    ('842f6b0d-202e-4845-8e00-9ae1eafa0a9f'::uuid, 'Bodegas',                  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  5),
    ('93bb0c87-3800-4013-aac7-7861cf8c6693'::uuid, 'Ubicaciones',              'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  6),
    ('4eedd740-8378-4167-8b1c-268f309b8a63'::uuid, 'Lineas',                   'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  7),
    ('58102719-8956-49d8-87b7-3e3ce2864c4c'::uuid, 'Categorias',               'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  8),
    ('e9b9b966-69ab-4c6d-864a-5cb09b9865ff'::uuid, 'Unidades',                 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  9),
    ('cef50dad-2c2b-4590-8076-cea9cdaa1828'::uuid, 'Marcas',                   'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 10),
    ('88683d59-956a-4ca2-b9ac-e75ff3e71ed2'::uuid, 'Tipos de Equipo',          'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 11),
    ('c1d84579-6dfa-4093-8a13-f956c82dbd30'::uuid, 'Plantillas',               'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 12),

    -- Administracion
    ('fbc4a1dd-3f3e-479a-b0d5-de08269d305f'::uuid, 'Inteligencia Operativa',   '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  1),
    ('aa4e161b-5bba-4a53-9899-16c14a5c488d'::uuid, 'Reporte Gerencia',         '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  2),
    ('e16d19eb-1f17-466c-b7b2-caaeedb1e4b4'::uuid, 'Reporte Administrativo',   '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  3),
    ('fca73089-de0d-4f06-8af9-96c32e4c68ce'::uuid, 'Reporte Operativo',        '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  4),
    ('a7fdca77-4ca6-4e44-9248-61d5ff6806e3'::uuid, 'Reporte Supervisor',       '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  5),
    ('b92cf3cc-7c15-4ff8-86a8-a7a97dde01cf'::uuid, 'Reporte Diario',           '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  6),
    ('071b66b1-788d-43a9-bbea-f2ae70a32f51'::uuid, 'Modelo Digital',           '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  7),
    ('c0feca54-6ebe-4812-be2b-41815f60a59f'::uuid, 'Alertas',                  '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  8),
    ('c5dea075-6897-43b8-b666-1118dc8a8bf7'::uuid, 'Dashboard',                '03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid,  9),

    -- Mantenimiento
    ('7944e1e6-9fa5-478e-ab7b-9bf7649fd312'::uuid, 'Unidades de Generación',   'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  1),
    ('91b25954-b2fe-4653-809d-7d146a153923'::uuid, 'Otros Equipos',            'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  2),
    ('2df82c17-6610-4be0-bae3-2e0d3eb6e663'::uuid, 'Programación',             'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  3),
    ('3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid, 'Ordenes de Trabajo',       'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  4),
    ('a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid, 'Proyectos',                'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  5),
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'Terceros',                 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  6),

    -- Inventario
    ('78e802b2-c485-4670-b167-e531f1679d6e'::uuid, 'Materiales',               '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  1),
    ('bee78b36-6214-4f40-9f84-8dd18dc1e4cd'::uuid, 'Ordenes de Compra',        '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  2),
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, 'Transferencia Bodega',     '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  3),
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, 'Ingreso de Bodega',        '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  4),
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, 'Egreso de Bodega',         '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  5),
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, 'Kardex',                   '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  6),
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, 'Stock Bodega',             '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  7),
    ('f7b9b4da-0081-419a-b9a2-17d312cef941'::uuid, 'Reservas de Bodega',       '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  8),

    -- Procesos
    ('159a5386-ca03-42ca-b12d-b75364ca56d2'::uuid, 'Análisis de Lubricante',   'fc891b52-389f-4e6e-a8cb-153ee1fd6723'::uuid,  1),
    ('73fd94fe-bb21-4dd2-b13c-82a81e9c2b7b'::uuid, 'O.S. Proveedores',         'fc891b52-389f-4e6e-a8cb-153ee1fd6723'::uuid,  2),

    -- Informes
    ('786685aa-d52f-429d-aa9d-2fddb1873a68'::uuid, 'Manual de Usuario',        'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid,  1),
    ('b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid, 'Reportería',               'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid,  2)
) AS destino(id, nombre, padre, posicion)
WHERE m.id = destino.id;

-- Orden de las secciones raiz.
UPDATE kpi_security.tb_menu AS m
SET menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-secciones'
FROM (
  VALUES
    ('73f6dbc7-febd-49e1-972c-bd72ddc6bb66'::uuid, 0),  -- Bienvenid@
    ('d1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 1),  -- Configuracion
    ('03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid, 2),  -- Administracion
    ('ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid, 3),  -- Mantenimiento
    ('4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 4),  -- Inventario
    ('fc891b52-389f-4e6e-a8cb-153ee1fd6723'::uuid, 5),  -- Procesos
    ('e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid, 6)   -- Informes
) AS destino(id, posicion)
WHERE m.id = destino.id;

-- ===========================================================================
-- 4. El Manual de Usuario duplicado se consolida en uno solo
-- ===========================================================================
-- Habia dos entradas con el MISMO `url_component` ('manual-usuario'): una en la
-- raiz con 40 usuarios y otra bajo Procesos con 4. Quien solo tenia la de
-- Procesos habria perdido el manual al retirarla, asi que primero se le
-- traspasa el acceso a la que se conserva.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports, reports_permit
)
SELECT
  gen_random_uuid(), origen.user_id,
  '786685aa-d52f-429d-aa9d-2fddb1873a68'::uuid, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  origen.is_readed, origen.is_created, origen.is_edited,
  origen.is_deleted, origen.is_reports, origen.reports_permit
FROM kpi_security.tb_menu_user origen
WHERE origen.menu_id = 'a1a18e2d-c67a-4bb4-a261-be11238b568e'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = '786685aa-d52f-429d-aa9d-2fddb1873a68'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports, reports_permit
)
SELECT
  gen_random_uuid(), origen.role_id,
  '786685aa-d52f-429d-aa9d-2fddb1873a68'::uuid, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  origen.is_readed, origen.is_created, origen.is_edited,
  origen.is_deleted, origen.is_reports, origen.reports_permit
FROM kpi_security.tb_menu_role origen
WHERE origen.menu_id = 'a1a18e2d-c67a-4bb4-a261-be11238b568e'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = '786685aa-d52f-429d-aa9d-2fddb1873a68'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

-- ===========================================================================
-- 5. Entradas que se retiran
-- ===========================================================================
-- El arbol filtra por `is_deleted`, NO por `status`: poner INACTIVE no basta.
-- No se borran filas ni permisos: revertir esto es un UPDATE.
--
--   Planes             -> decision del negocio, sale del menu
--   Reporte detallado  -> sin usuarios ni roles; su ruta ya redirige a
--                         dashboard-gerencia desde la unificacion del tablero
--   Manual de usuario  -> duplicado consolidado en el bloque 4
UPDATE kpi_security.tb_menu
SET status = 'INACTIVE',
    is_deleted = true,
    deleted_at = now(),
    deleted_by = 'menu-secciones',
    updated_at = now(),
    updated_by = 'menu-secciones'
WHERE id IN (
  'fb7ca7d8-2333-47b5-a38f-87745ae6558e'::uuid,  -- Planes
  '0ccd9559-e1e3-43a8-8de4-6836a6bc85f9'::uuid,  -- Reporte detallado
  'a1a18e2d-c67a-4bb4-a261-be11238b568e'::uuid   -- Manual de usuario (duplicado)
);

-- ===========================================================================
-- 6. Permisos de las pantallas nuevas
-- ===========================================================================
-- Proyectos hereda la audiencia de Ordenes de Trabajo: es una pantalla de
-- mantenimiento y ese es su publico natural.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT
  gen_random_uuid(), origen.user_id,
  'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
WHERE origen.menu_id = '3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = 'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT
  gen_random_uuid(), origen.role_id,
  'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
WHERE origen.menu_id = '3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = 'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

-- Reporteria hereda la audiencia de Reporte Gerencia: es reporteria, no
-- documentacion, asi que NO se copia del Manual -- que lo tienen 40 usuarios --
-- para no abrir de entrada una pantalla de informes a toda la operacion.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT
  gen_random_uuid(), origen.user_id,
  'b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
WHERE origen.menu_id = 'aa4e161b-5bba-4a53-9899-16c14a5c488d'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = 'b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT
  gen_random_uuid(), origen.role_id,
  'b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
WHERE origen.menu_id = 'aa4e161b-5bba-4a53-9899-16c14a5c488d'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = 'b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

-- ===========================================================================
-- 7. Nadie pierde de vista una opcion movida por no tener el padre asignado
-- ===========================================================================
-- Esta es LA trampa de tocar el menu. El arbol se arma con los menus asignados
-- al usuario: si el padre no esta, el hijo queda colgando en la raiz.
--
-- Se concede LECTURA del padre a quien tenga cualquiera de sus hijos. Los
-- permisos de una seccion son solo de navegacion: no dan acceso a ninguna
-- pantalla por si mismos.
--
-- Se hace de forma generica contra el arbol ya reorganizado, asi cubre tanto
-- las secciones nuevas como las que reciben entradas de otra seccion.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT
  gen_random_uuid(), origen.user_id, hijo.menu_id, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
JOIN kpi_security.tb_menu hijo
  ON hijo.id = origen.menu_id
 AND hijo.menu_id IS NOT NULL
 AND COALESCE(hijo.is_deleted, false) = false
WHERE COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = hijo.menu_id
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT
  gen_random_uuid(), origen.role_id, hijo.menu_id, 'ACTIVE',
  'menu-secciones', 'menu-secciones', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
JOIN kpi_security.tb_menu hijo
  ON hijo.id = origen.menu_id
 AND hijo.menu_id IS NOT NULL
 AND COALESCE(hijo.is_deleted, false) = false
WHERE COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = hijo.menu_id
      AND COALESCE(ya.is_delete, false) = false
  );

COMMIT;
