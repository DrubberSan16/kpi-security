-- ---------------------------------------------------------------------------
-- Menu: Inventario pasa a Mantenimiento/Transacciones, Administracion pasa a
-- Informes y Terceros pasa a Configuracion
-- ---------------------------------------------------------------------------
-- Queda (raiz: Bienvenid@ (0), Configuracion (1), Mantenimiento/Transacciones (3),
-- Informes (6)):
--
--   Configuracion (1) ........ ..., Plantillas (15), Terceros (16)
--   Mantenimiento/Transacciones (3)
--     Programacion (1), Ordenes de Trabajo (2), OT. Proyecto (3),
--     O.S. Proveedores (4),
--     Inventario (5)
--       Materiales (1)
--         Transferencia Bodega, Ingreso de Bodega, Egreso de Bodega, Kardex,
--         Stock Bodega
--       Ordenes de Compra (2), Reservas de bodega (3)
--   Informes (6)
--     Manual de Usuario (1), Analisis de Lubricante (2),
--     Administracion (3)
--       Inteligencia Operativa, Reporte Gerencia, Reporte Administrativo,
--       Reporte Operativo, Reporte Supervisor, Reporte Diario, Modelo Digital,
--       Alertas, Dashboard, Reporte detallado
--     Reporteria (4)   <- cede el 3; se queda al final porque se despliega
--
-- Solo cambia de padre y de posicion la CABEZA de cada bloque: Terceros,
-- Inventario y Administracion. Sus hijos siguen colgando de ellos, asi que
-- arrastran su rama completa sin tocar ninguna otra fila.
--
-- NINGUN `url_component` cambia, asi que ningun permiso del codigo se mueve, y
-- NINGUNA fila de tb_menu_user / tb_menu_role existente se modifica: los
-- permisos de cada usuario y cada rol quedan tal cual.
--
-- La trampa de siempre al mover una entrada: `getMenuTreeByUser` arma el arbol
-- con las filas asignadas y engancha por `menu_id`; quien tiene el hijo pero
-- NO tiene ninguna fila del padre nuevo lo ve suelto en la raiz. Los bloques de
-- permisos de abajo conceden LECTURA del padre nuevo (una seccion, que solo
-- navega y no da acceso a nada por si sola) cuando no hay ninguna fila viva de
-- el; una fila desactivada cuenta como fila y nunca se reactiva. El 2026-09-29,
-- antes de aplicarlo, solo Administracion -> Informes tenia afectados: el
-- usuario bodegacoca y los roles Tecnico 3, Tecnico 2 test y Tecnico prueba.
--
-- Idempotente.
--
-- Como deshacerlo (estado del 2026-09-29 antes de aplicarlo):
--   Terceros 18fa227e:        menu_id = ca559bc5 (Mantenimiento/Transacciones), posicion 5
--   Inventario 4ce083f0:      menu_id = NULL, posicion 4
--   Administracion 03e1cd96:  menu_id = NULL, posicion 2
--   Reporteria b7e2f0a9:      posicion 3 (su padre, Informes e2c9b34f, no cambia)
--   Y borrar las filas de permisos que este script agrego:
--     DELETE FROM kpi_security.tb_menu_user WHERE created_by = 'menu-anidado-terceros-inventario-administracion';
--     DELETE FROM kpi_security.tb_menu_role WHERE created_by = 'menu-anidado-terceros-inventario-administracion';
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Nueva ubicacion y orden
-- ===========================================================================
UPDATE kpi_security.tb_menu AS m
SET menu_id = destino.padre,
    menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-anidado-terceros-inventario-administracion'
FROM (
  VALUES
    -- Configuracion: Terceros al final, tras Plantillas (15)
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 16),  -- Terceros

    -- Mantenimiento/Transacciones: Inventario ocupa el 5 que deja Terceros
    ('4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid, 5),   -- Inventario

    -- Informes: Administracion antes de Reporteria
    ('03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid, 3),   -- Administracion
    ('b7e2f0a9-5c48-4a13-9b76-1e8d4c3a9f52'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid, 4)    -- Reporteria
) AS destino(id, padre, posicion)
WHERE m.id = destino.id;

-- ===========================================================================
-- 2. Nadie ve una opcion suelta en la raiz por no tener ninguna fila del padre
-- ===========================================================================
-- Solo se inserta cuando NO hay ninguna fila viva del padre. Se concede
-- LECTURA, la de una seccion; nunca se reactiva una fila desactivada.
--
-- pares (hijo -> padre): Inventario      -> Mantenimiento/Transacciones;
--                        Administracion  -> Informes;
--                        Terceros        -> Configuracion.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (par.padre, origen.user_id)
  gen_random_uuid(), origen.user_id, par.padre, 'ACTIVE',
  'menu-anidado-terceros-inventario-administracion',
  'menu-anidado-terceros-inventario-administracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
JOIN (
  VALUES
    ('4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid),
    ('03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid),
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid)
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
  'menu-anidado-terceros-inventario-administracion',
  'menu-anidado-terceros-inventario-administracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
JOIN (
  VALUES
    ('4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid),
    ('03e1cd96-8a29-40e0-b5fa-b2fab798ac78'::uuid, 'e2c9b34f-7a10-4d88-9e52-3f7b6c8a2e41'::uuid),
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid)
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
