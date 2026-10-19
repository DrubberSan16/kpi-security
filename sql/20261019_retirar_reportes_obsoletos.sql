-- Retira tres opciones de Informes y revoca sus permisos directos y por rol.
-- Requiere desplegar primero la eliminación del seed de Reporte detallado.
-- Respaldar las filas afectadas antes de ejecutar. Idempotente, sin borrado físico.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TEMP TABLE reportes_retirados ON COMMIT DROP AS
SELECT id, nombre FROM kpi_security.tb_menu
WHERE url_component IN ('dashboard-operativo', 'dashboard-supervisores', 'reporte-detallado');

DO $$
BEGIN
  IF (SELECT count(*) FROM reportes_retirados) <> 3 THEN
    RAISE EXCEPTION 'Se esperaban exactamente tres menús; se cancela el retiro';
  END IF;
  IF EXISTS (
    SELECT 1 FROM kpi_security.tb_menu
    WHERE menu_id IN (SELECT id FROM reportes_retirados) AND NOT is_deleted
  ) THEN
    RAISE EXCEPTION 'Los menús tienen hijos activos; se cancela el retiro';
  END IF;
END $$;

UPDATE kpi_security.tb_menu_user
SET status = 'INACTIVE', is_delete = true,
    is_readed = false, is_created = false, is_edited = false,
    is_deleted = false, is_reports = false, reports_permit = NULL,
    deleted_at = COALESCE(deleted_at, now() AT TIME ZONE 'America/Guayaquil'),
    deleted_by = 'retiro-reportes-obsoletos-20261019',
    updated_at = now() AT TIME ZONE 'America/Guayaquil',
    updated_by = 'retiro-reportes-obsoletos-20261019'
WHERE menu_id IN (SELECT id FROM reportes_retirados)
  AND (NOT is_delete OR status <> 'INACTIVE' OR is_readed OR is_created OR is_edited OR is_deleted OR is_reports OR reports_permit IS NOT NULL);

UPDATE kpi_security.tb_menu_role
SET status = 'INACTIVE', is_delete = true,
    is_readed = false, is_created = false, is_edited = false,
    is_deleted = false, is_reports = false, reports_permit = NULL,
    deleted_at = COALESCE(deleted_at, now() AT TIME ZONE 'America/Guayaquil'),
    deleted_by = 'retiro-reportes-obsoletos-20261019',
    updated_at = now() AT TIME ZONE 'America/Guayaquil',
    updated_by = 'retiro-reportes-obsoletos-20261019'
WHERE menu_id IN (SELECT id FROM reportes_retirados)
  AND (NOT is_delete OR status <> 'INACTIVE' OR is_readed OR is_created OR is_edited OR is_deleted OR is_reports OR reports_permit IS NOT NULL);

UPDATE kpi_security.tb_menu
SET status = 'INACTIVE', is_deleted = true,
    deleted_at = COALESCE(deleted_at, now() AT TIME ZONE 'America/Guayaquil'),
    deleted_by = 'retiro-reportes-obsoletos-20261019',
    updated_at = now() AT TIME ZONE 'America/Guayaquil',
    updated_by = 'retiro-reportes-obsoletos-20261019'
WHERE id IN (SELECT id FROM reportes_retirados) AND (NOT is_deleted OR status <> 'INACTIVE');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM kpi_security.tb_menu_user WHERE menu_id IN (SELECT id FROM reportes_retirados) AND NOT is_delete)
    OR EXISTS (SELECT 1 FROM kpi_security.tb_menu_role WHERE menu_id IN (SELECT id FROM reportes_retirados) AND NOT is_delete)
    OR EXISTS (SELECT 1 FROM kpi_security.tb_menu WHERE id IN (SELECT id FROM reportes_retirados) AND NOT is_deleted) THEN
    RAISE EXCEPTION 'Quedan menús o permisos activos; se revierte la transacción';
  END IF;
END $$;

SELECT nombre AS menu_retirado FROM reportes_retirados ORDER BY nombre;
COMMIT;
