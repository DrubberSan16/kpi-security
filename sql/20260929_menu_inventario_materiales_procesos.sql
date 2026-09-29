-- ---------------------------------------------------------------------------
-- Inventario anida sus movimientos bajo Materiales; se retira la seccion
-- Procesos y sus dos opciones pasan a Mantenimiento/Transacciones e Informes
-- ---------------------------------------------------------------------------
-- Inventario queda:
--   Materiales (1)
--     Transferencia Bodega (1), Ingreso de Bodega (2), Egreso de Bodega (3),
--     Kardex (4), Stock Bodega (5)
--   Ordenes de Compra (2)
--   Reservas de bodega (3)
--
-- Procesos deja de existir (borrado logico, como Notificaciones el 2026-09-10):
--   O.S. Proveedores       -> Mantenimiento/Transacciones (4; Terceros pasa a 5)
--   Analisis de Lubricante -> Informes (2; Reporteria pasa a 3, para que la
--                             opcion que se despliega hacia abajo quede al final)
--
-- NINGUN `url_component` cambia, asi que ningun permiso del codigo se mueve.
--
-- La trampa de siempre al mover una entrada: `getMenuTreeByUser` arma el arbol
-- con las filas asignadas y engancha por `menu_id`; quien tiene el hijo pero
-- NO tiene ninguna fila del padre nuevo lo ve suelto en la raiz. El 2026-09-29
-- nadie estaba en ese caso. Ojo con la excepcion que si existe: una fila del
-- padre con la lectura DESACTIVADA (hector.castillo tiene Materiales
-- desactivado a proposito) SI cuenta como fila: el arbol la incluye como
-- contenedor de sus hijos sin darle acceso a la pantalla. Por eso los bloques
-- de permisos de abajo solo insertan cuando no hay ninguna fila viva del padre,
-- y nunca reactivan una desactivada.
--
-- Idempotente.
--
-- Como deshacerlo (estado del 2026-09-29 antes de aplicarlo):
--   Inventario 4ce083f0: Materiales 78e802b2 (1), Ordenes de Compra bee78b36 (2),
--     Transferencia Bodega fe50dafb (3), Ingreso de Bodega 105a4104 (4),
--     Egreso de Bodega 7db68add (5), Kardex 8aca8ba6 (6), Stock Bodega 4ec77efc (7),
--     Reservas de bodega f7b9b4da (10), todos con menu_id = 4ce083f0
--   Mantenimiento/Transacciones ca559bc5: Terceros 18fa227e (5)
--   Informes e2c9b34f: Reporteria b7e2f0a9 (2)
--   Procesos fc891b52: is_deleted = false, status = 'ACTIVE'; con Analisis de
--     Lubricante 159a5386 (1) y O.S. Proveedores 73fd94fe (2) colgando de el
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Nueva ubicacion y orden
-- ===========================================================================
UPDATE kpi_security.tb_menu AS m
SET menu_id = destino.padre,
    menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-inventario-procesos'
FROM (
  VALUES
    -- Inventario
    ('78e802b2-c485-4670-b167-e531f1679d6e'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 1),  -- Materiales
    ('bee78b36-6214-4f40-9f84-8dd18dc1e4cd'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 2),  -- Ordenes de Compra
    ('f7b9b4da-0081-419a-b9a2-17d312cef941'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 3),  -- Reservas de bodega

    -- Materiales
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid, 1),  -- Transferencia Bodega
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid, 2),  -- Ingreso de Bodega
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid, 3),  -- Egreso de Bodega
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid, 4),  -- Kardex
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid, 5),  -- Stock Bodega

    -- Mantenimiento/Transacciones
    ('73fd94fe-bb21-4dd2-b13c-82a81e9c2b7b'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid, 4),  -- O.S. Proveedores
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid, 5),  -- Terceros

    -- Informes
    ('159a5386-ca03-42ca-b12d-b75364ca56d2'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid, 2),  -- Analisis de Lubricante
    ('b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid, 3)   -- Reporteria
) AS destino(id, padre, posicion)
WHERE m.id = destino.id;

-- ===========================================================================
-- 2. Procesos ya no tiene opciones: se retira. `getMenuTreeByUser` filtra por
--    `is_deleted`, no por `status`, asi que es el borrado logico lo que la quita.
-- ===========================================================================
UPDATE kpi_security.tb_menu
SET is_deleted = true,
    status = 'INACTIVE',
    deleted_at = now(),
    deleted_by = 'menu-inventario-procesos',
    updated_at = now(),
    updated_by = 'menu-inventario-procesos'
WHERE id = 'fc891b52-389f-4e6e-a8cb-153ee1fd6723'::uuid
  AND COALESCE(is_deleted, false) = false;

-- ===========================================================================
-- 3. Nadie ve una opcion suelta en la raiz por no tener ninguna fila del padre
-- ===========================================================================
-- Solo se inserta cuando NO hay ninguna fila viva del padre (una desactivada
-- cuenta como fila: ver la cabecera). Se concede LECTURA, la de una seccion o
-- contenedor; nunca se reactiva una fila desactivada.
--
-- pares (hijo -> padre): los cinco movimientos -> Materiales;
--                        O.S. Proveedores      -> Mantenimiento/Transacciones;
--                        Analisis de Lubricante -> Informes.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (par.padre, origen.user_id)
  gen_random_uuid(), origen.user_id, par.padre, 'ACTIVE',
  'menu-inventario-procesos', 'menu-inventario-procesos', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
JOIN (
  VALUES
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('73fd94fe-bb21-4dd2-b13c-82a81e9c2b7b'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid),
    ('159a5386-ca03-42ca-b12d-b75364ca56d2'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid)
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
  'menu-inventario-procesos', 'menu-inventario-procesos', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
JOIN (
  VALUES
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('105a4104-2b6e-40d3-b81b-894942f3f964'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('7db68add-5b47-4485-968b-652339f126f8'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('4ec77efc-32d8-4295-a4c4-d7bdf3e86b7d'::uuid, '78e802b2-c485-4670-b167-e531f1679d6e'::uuid),
    ('73fd94fe-bb21-4dd2-b13c-82a81e9c2b7b'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid),
    ('159a5386-ca03-42ca-b12d-b75364ca56d2'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid)
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
