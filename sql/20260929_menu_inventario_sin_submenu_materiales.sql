-- ---------------------------------------------------------------------------
-- Inventario: los movimientos dejan de colgar de Materiales
-- ---------------------------------------------------------------------------
-- Materiales vuelve a ser una opcion sin hijos y sus cinco movimientos pasan a
-- ser opciones de Inventario, a su mismo nivel. Inventario queda:
--
--   Materiales (1)
--   Transferencia Bodega (2), Ingreso de Bodega (3), Egreso de Bodega (4),
--   Kardex (5), Stock Bodega (6)
--   Ordenes de Compra (7), Reservas de bodega (8)
--
-- Es el orden que se veia en pantalla, solo que sin la sangria de Materiales.
-- Ordenes de Compra y Reservas de bodega bajan de posicion para dejarles sitio.
--
-- NINGUN `url_component` cambia, asi que ningun permiso del codigo se mueve, y
-- NINGUNA fila de tb_menu_user / tb_menu_role existente se modifica.
--
-- La trampa de siempre al mover una entrada: `getMenuTreeByUser` arma el arbol
-- con las filas asignadas y engancha por `menu_id`; quien tiene el hijo pero
-- NO tiene ninguna fila de Inventario lo ve suelto en la raiz. El bloque de
-- permisos de abajo concede LECTURA de Inventario (una seccion, que solo
-- navega y no da acceso a nada por si sola) en ese caso; una fila desactivada
-- cuenta como fila y nunca se reactiva. El 2026-09-29, antes de aplicarlo,
-- nadie estaba afectado: quien tenia uno de los cinco movimientos ya tenia
-- Inventario, porque Materiales colgaba de el. El bloque queda por si el script
-- se aplica a otra base.
--
-- Idempotente.
--
-- Como deshacerlo (estado del 2026-09-29 antes de aplicarlo):
--   Inventario 4ce083f0: Materiales 78e802b2 (1), Ordenes de Compra bee78b36 (2),
--     Reservas de bodega f7b9b4da (3)
--   Materiales 78e802b2 (menu_id de cada uno): Transferencia Bodega fe50dafb (1),
--     Ingreso de Bodega 105a4104 (2), Egreso de Bodega 7db68add (3),
--     Kardex 8aca8ba6 (4), Stock Bodega 4ec77efc (5)
--   Y borrar las filas de permisos que este script agrego, si agrego alguna:
--     DELETE FROM kpi_security.tb_menu_user WHERE created_by = 'menu-inventario-sin-submenu-materiales';
--     DELETE FROM kpi_security.tb_menu_role WHERE created_by = 'menu-inventario-sin-submenu-materiales';
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Nueva ubicacion y orden (Materiales se queda en el 1 de Inventario)
-- ===========================================================================
UPDATE kpi_security.tb_menu AS m
SET menu_id = destino.padre,
    menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-inventario-sin-submenu-materiales'
FROM (
  VALUES
    -- Inventario
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 2),  -- Transferencia Bodega
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 3),  -- Ingreso de Bodega
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 4),  -- Egreso de Bodega
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 5),  -- Kardex
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 6),  -- Stock Bodega
    ('bee78b36-6214-4f40-9f84-8dd18dc1e4cd'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 7),  -- Ordenes de Compra
    ('f7b9b4da-0081-419a-b9a2-17d312cef941'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 8)   -- Reservas de bodega
) AS destino(id, padre, posicion)
WHERE m.id = destino.id;

-- ===========================================================================
-- 2. Nadie ve una opcion suelta en la raiz por no tener ninguna fila del padre
-- ===========================================================================
-- Solo se inserta cuando NO hay ninguna fila viva de Inventario. Se concede
-- LECTURA, la de una seccion; nunca se reactiva una fila desactivada.
--
-- pares (hijo -> padre): los cinco movimientos -> Inventario.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (par.padre, origen.user_id)
  gen_random_uuid(), origen.user_id, par.padre, 'ACTIVE',
  'menu-inventario-sin-submenu-materiales', 'menu-inventario-sin-submenu-materiales', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
JOIN (
  VALUES
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid)
) AS par(hijo, padre) ON par.hijo = origen.menu_id
WHERE COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = par.padre
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (par.padre, origen.role_id)
  gen_random_uuid(), origen.role_id, par.padre, 'ACTIVE',
  'menu-inventario-sin-submenu-materiales', 'menu-inventario-sin-submenu-materiales', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
JOIN (
  VALUES
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid)
) AS par(hijo, padre) ON par.hijo = origen.menu_id
WHERE COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = par.padre
      AND COALESCE(ya.is_delete, false) = false
  );

COMMIT;
