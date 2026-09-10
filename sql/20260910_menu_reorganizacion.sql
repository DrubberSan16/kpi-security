-- ---------------------------------------------------------------------------
-- Reorganizacion del menu: cada opcion bajo la seccion a la que pertenece
-- ---------------------------------------------------------------------------
-- El menu habia crecido por acumulacion y varias opciones quedaron lejos de su
-- seccion natural: Kardex y Transferencia de bodegas son inventario puro pero
-- colgaban de Procesos y de Mantenimiento, y las ordenes de trabajo -- que son
-- LA pantalla de mantenimiento -- estaban en Procesos.
--
-- Ademas se separa la flota de generacion del resto de equipos: son el 60% del
-- parque y se administran aparte, asi que tienen su propia entrada.
--
-- Al mover un hijo hay que asegurarse de que quien lo tiene asignado tambien
-- tenga asignado el padre nuevo; si no, el arbol lo deja suelto en la raiz
-- porque no encuentra de quien colgar.
--
-- Idempotente: se puede reejecutar sin duplicar filas ni degradar permisos.
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Kardex y Transferencia de bodegas pasan a Inventario
-- ===========================================================================
UPDATE kpi_security.tb_menu
SET menu_id = '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  -- Inventario
    menu_position = 13,
    updated_at = now(),
    updated_by = 'menu-reorganizacion'
WHERE id = '8aca8ba6-1334-4a25-afb1-2c712831c8d3';  -- Kardex

UPDATE kpi_security.tb_menu
SET menu_id = '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  -- Inventario
    menu_position = 14,
    updated_at = now(),
    updated_by = 'menu-reorganizacion'
WHERE id = 'fe50dafb-57e6-49a9-93eb-a2367545c12c';  -- Transferencia Bodegas

-- ===========================================================================
-- 2. Ordenes de trabajo pasan a Mantenimiento
-- ===========================================================================
UPDATE kpi_security.tb_menu
SET menu_id = 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  -- Mantenimiento
    menu_position = 1,
    updated_at = now(),
    updated_by = 'menu-reorganizacion'
WHERE id = '3320a78e-a059-4ef2-8cc7-337e047a3b1e';  -- Ordenes Trabajo

-- ===========================================================================
-- 3. Unidades de generacion: entrada propia dentro de Mantenimiento
-- ===========================================================================
INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  gen_random_uuid(),
  'Unidades de generación',
  'Flota de generación: los equipos cuyo tipo es una unidad de generación.',
  'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  -- Mantenimiento
  'unidades-generacion',
  2,
  'ACTIVE',
  'menu-reorganizacion',
  'menu-reorganizacion',
  false,
  'mdi-engine'
WHERE NOT EXISTS (
  SELECT 1 FROM kpi_security.tb_menu m WHERE m.url_component = 'unidades-generacion'
);

UPDATE kpi_security.tb_menu
SET menu_id = 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,
    status = 'ACTIVE',
    is_deleted = false,
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = now(),
    updated_by = 'menu-reorganizacion'
WHERE url_component = 'unidades-generacion';

-- Permisos copiados de Equipos: quien administra equipos administra la flota
-- de generacion, que hasta ahora estaba dentro de esa misma lista.
INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports, reports_permit
)
SELECT
  gen_random_uuid(), origen.role_id, destino.id, 'ACTIVE',
  'menu-reorganizacion', 'menu-reorganizacion', false,
  origen.is_readed, origen.is_created, origen.is_edited,
  origen.is_deleted, origen.is_reports, origen.reports_permit
FROM kpi_security.tb_menu_role origen
CROSS JOIN kpi_security.tb_menu destino
WHERE origen.menu_id = '91b25954-b2fe-4653-809d-7d146a153923'  -- Equipos
  AND COALESCE(origen.is_delete, false) = false
  AND destino.url_component = 'unidades-generacion'
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id AND ya.menu_id = destino.id
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports, reports_permit
)
SELECT
  gen_random_uuid(), origen.user_id, destino.id, 'ACTIVE',
  'menu-reorganizacion', 'menu-reorganizacion', false,
  origen.is_readed, origen.is_created, origen.is_edited,
  origen.is_deleted, origen.is_reports, origen.reports_permit
FROM kpi_security.tb_menu_user origen
CROSS JOIN kpi_security.tb_menu destino
WHERE origen.menu_id = '91b25954-b2fe-4653-809d-7d146a153923'  -- Equipos
  AND COALESCE(origen.is_delete, false) = false
  AND destino.url_component = 'unidades-generacion'
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id AND ya.menu_id = destino.id
      AND COALESCE(ya.is_delete, false) = false
  );

-- Marcas compartia posicion con la entrada nueva y el orden quedaba al azar.
UPDATE kpi_security.tb_menu
SET menu_position = 7,
    updated_at = now(),
    updated_by = 'menu-reorganizacion'
WHERE id = 'cef50dad-2c2b-4590-8076-cea9cdaa1828'  -- Marcas
  AND menu_position = 2;

-- ===========================================================================
-- 4. Se retira Notificaciones
-- ===========================================================================
-- No tiene hijos ni pantalla propia: era un contenedor vacio en la barra.
UPDATE kpi_security.tb_menu
SET status = 'INACTIVE',
    is_deleted = true,
    deleted_at = now(),
    deleted_by = 'menu-reorganizacion',
    updated_at = now(),
    updated_by = 'menu-reorganizacion'
WHERE id = 'f089c444-165b-4c37-9700-ab73ebf17d32';  -- Notificaciones

-- ===========================================================================
-- 5. Nadie pierde de vista una opcion movida por no tener el padre asignado
-- ===========================================================================
-- El arbol se arma con los menus que el usuario tiene asignados: si el padre no
-- esta, el hijo queda colgando en la raiz. Se concede LECTURA del padre a quien
-- tenga alguno de los hijos movidos; los permisos de la seccion son solo de
-- navegacion, no dan acceso a nada por si mismos.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT
  gen_random_uuid(), origen.user_id, padre.menu_id, 'ACTIVE',
  'menu-reorganizacion', 'menu-reorganizacion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
JOIN (
  VALUES
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid)
) AS padre(hijo_id, menu_id) ON padre.hijo_id = origen.menu_id
WHERE COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id AND ya.menu_id = padre.menu_id
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT
  gen_random_uuid(), origen.role_id, padre.menu_id, 'ACTIVE',
  'menu-reorganizacion', 'menu-reorganizacion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
JOIN (
  VALUES
    ('8aca8ba6-1334-4a25-afb1-2c712831c8d3'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('fe50dafb-57e6-49a9-93eb-a2367545c12c'::uuid, '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid),
    ('3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid)
) AS padre(hijo_id, menu_id) ON padre.hijo_id = origen.menu_id
WHERE COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id AND ya.menu_id = padre.menu_id
      AND COALESCE(ya.is_delete, false) = false
  );

COMMIT;
