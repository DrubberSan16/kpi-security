-- ---------------------------------------------------------------------------
-- Ingresos y egresos de bodega como opciones propias del menu Inventario
-- ---------------------------------------------------------------------------
-- Registrar mercaderia que entra o sale era un boton dentro del Kardex, que es
-- una pantalla de consulta de saldos. Quien mueve material no viene a mirar el
-- saldo: viene a hacer el movimiento y a encontrar el que hizo ayer. Ahora son
-- dos opciones dentro de Inventario, con su propia lista y sus filtros.
--
-- Los permisos se copian de Kardex, que es donde vivian esos botones: quien
-- podia registrar un ingreso desde el Kardex sigue pudiendo hacerlo desde la
-- pantalla nueva, y quien no podia tampoco gana nada.
--
-- Idempotente: se puede reejecutar sin duplicar filas ni degradar permisos.
-- ---------------------------------------------------------------------------

BEGIN;

-- 1. Las dos entradas nuevas, colgando de Inventario.
INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  gen_random_uuid(),
  datos.nombre,
  datos.descripcion,
  '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,  -- Inventario
  datos.url_component,
  datos.menu_position,
  'ACTIVE',
  'menu-ingresos-egresos-bodega',
  'menu-ingresos-egresos-bodega',
  false,
  datos.icon
FROM (
  VALUES
    ('Ingresos de bodega', 'Mercaderia que entra a una bodega, con su documento IB.', 'ingresos-bodega', 11::bigint, 'mdi-tray-arrow-down'),
    ('Egresos de bodega',  'Material que sale de una bodega, con su documento EB.',   'egresos-bodega',  12::bigint, 'mdi-tray-arrow-up')
) AS datos(nombre, descripcion, url_component, menu_position, icon)
WHERE NOT EXISTS (
  SELECT 1
  FROM kpi_security.tb_menu existente
  WHERE existente.url_component = datos.url_component
);

-- Si ya existian pero estaban retiradas, se reactivan en su lugar.
UPDATE kpi_security.tb_menu
SET menu_id = '4ce083f0-5d9c-4447-8883-d30de6fa71be'::uuid,
    status = 'ACTIVE',
    is_deleted = false,
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = now(),
    updated_by = 'menu-ingresos-egresos-bodega'
WHERE url_component IN ('ingresos-bodega', 'egresos-bodega');

-- 2. Permisos por rol: se copian de Kardex.
INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports, reports_permit
)
SELECT
  gen_random_uuid(),
  origen.role_id,
  destino.id,
  'ACTIVE',
  'menu-ingresos-egresos-bodega',
  'menu-ingresos-egresos-bodega',
  false,
  origen.is_readed,
  origen.is_created,
  origen.is_edited,
  origen.is_deleted,
  origen.is_reports,
  origen.reports_permit
FROM kpi_security.tb_menu_role origen
CROSS JOIN kpi_security.tb_menu destino
WHERE origen.menu_id = '8aca8ba6-1334-4a25-afb1-2c712831c8d3'  -- Kardex
  AND COALESCE(origen.is_delete, false) = false
  AND destino.url_component IN ('ingresos-bodega', 'egresos-bodega')
  AND NOT EXISTS (
    SELECT 1
    FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = destino.id
      AND COALESCE(ya.is_delete, false) = false
  );

-- 3. Permisos por usuario: mismo criterio.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports, reports_permit
)
SELECT
  gen_random_uuid(),
  origen.user_id,
  destino.id,
  'ACTIVE',
  'menu-ingresos-egresos-bodega',
  'menu-ingresos-egresos-bodega',
  false,
  origen.is_readed,
  origen.is_created,
  origen.is_edited,
  origen.is_deleted,
  origen.is_reports,
  origen.reports_permit
FROM kpi_security.tb_menu_user origen
CROSS JOIN kpi_security.tb_menu destino
WHERE origen.menu_id = '8aca8ba6-1334-4a25-afb1-2c712831c8d3'  -- Kardex
  AND COALESCE(origen.is_delete, false) = false
  AND destino.url_component IN ('ingresos-bodega', 'egresos-bodega')
  AND NOT EXISTS (
    SELECT 1
    FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = destino.id
      AND COALESCE(ya.is_delete, false) = false
  );

COMMIT;
