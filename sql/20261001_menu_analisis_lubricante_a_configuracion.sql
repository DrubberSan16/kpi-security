-- ---------------------------------------------------------------------------
-- Menu: Analisis de Lubricante pasa de Informes a Configuracion
-- ---------------------------------------------------------------------------
-- Queda (raiz: Bienvenid@ (0), Configuracion (1), Mantenimiento/Transacciones (3),
-- Informes (6)):
--
--   Configuracion (1) ........ ..., Plantillas (15), Terceros (16),
--                              Empleados (17), Analisis de Lubricante (18)
--   Informes (6)
--     Manual de Usuario (1), Administracion (3), Reporteria (4)
--     (el 2 que dejo Analisis de Lubricante queda libre: el orden se resuelve
--     por la posicion, no hace falta renumerar y asi no se toca otra fila)
--
-- Solo cambia de padre y de posicion la fila de Analisis de Lubricante
-- (159a5386). Entra al final de Configuracion, como Terceros y Empleados.
--
-- SU `url_component` NO CAMBIA (`inteligencia-analisis-lubricante`), asi que
-- ningun permiso del codigo se mueve, y NINGUNA fila de tb_menu_user /
-- tb_menu_role existente se modifica: los permisos de cada usuario y cada rol
-- quedan tal cual.
--
-- La trampa de siempre al mover una entrada: `getMenuTreeByUser` arma el arbol
-- con las filas asignadas y engancha por `menu_id`; quien tiene el hijo pero
-- NO tiene ninguna fila del padre nuevo lo ve suelto en la raiz. Los bloques de
-- permisos de abajo conceden LECTURA del padre nuevo (una seccion, que solo
-- navega y no da acceso a nada por si sola) cuando no hay ninguna fila viva de
-- el; una fila desactivada cuenta como fila y nunca se reactiva. El 2026-10-01,
-- antes de aplicarlo, no habia nadie afectado: los 23 usuarios activos y los 5
-- roles que tienen la opcion ya tenian Configuracion. El bloque se deja por si
-- el script se vuelve a ejecutar mas adelante.
--
-- Idempotente.
--
-- Como deshacerlo (estado del 2026-10-01 antes de aplicarlo):
--   Analisis de Lubricante 159a5386:  menu_id = e2c9b34f (Informes), posicion 2
--   Y borrar las filas de permisos que este script agrego (si agrego alguna):
--     DELETE FROM kpi_security.tb_menu_user WHERE created_by = 'menu-analisis-lubricante-a-configuracion';
--     DELETE FROM kpi_security.tb_menu_role WHERE created_by = 'menu-analisis-lubricante-a-configuracion';
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Nueva ubicacion y orden
-- ===========================================================================
UPDATE kpi_security.tb_menu
SET menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20',   -- Configuracion
    menu_position = 18,                                  -- al final, tras Empleados (17)
    updated_at = now(),
    updated_by = 'menu-analisis-lubricante-a-configuracion'
WHERE id = '159a5386-ca03-42ca-b12d-b75364ca56d2'        -- Analisis de Lubricante
  AND (menu_id IS DISTINCT FROM 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'
       OR menu_position IS DISTINCT FROM 18);

-- ===========================================================================
-- 2. Nadie ve la opcion suelta en la raiz por no tener ninguna fila del padre
-- ===========================================================================
-- Solo se inserta cuando NO hay ninguna fila viva del padre. Se concede
-- LECTURA, la de una seccion; nunca se reactiva una fila desactivada.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (origen.user_id)
  gen_random_uuid(), origen.user_id, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20', 'ACTIVE',
  'menu-analisis-lubricante-a-configuracion',
  'menu-analisis-lubricante-a-configuracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
WHERE origen.menu_id = '159a5386-ca03-42ca-b12d-b75364ca56d2'
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (origen.role_id)
  gen_random_uuid(), origen.role_id, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20', 'ACTIVE',
  'menu-analisis-lubricante-a-configuracion',
  'menu-analisis-lubricante-a-configuracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
WHERE origen.menu_id = '159a5386-ca03-42ca-b12d-b75364ca56d2'
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'
      AND COALESCE(ya.is_delete, false) = false
  );

-- ===========================================================================
-- 3. Comprobacion: si alguien quedo con la opcion y sin su padre, se aborta todo
-- ===========================================================================
DO $$
DECLARE
  huerfanos_usuario integer;
  huerfanos_rol integer;
BEGIN
  SELECT count(DISTINCT mu.user_id) INTO huerfanos_usuario
  FROM kpi_security.tb_menu_user mu
  WHERE mu.menu_id = '159a5386-ca03-42ca-b12d-b75364ca56d2'
    AND COALESCE(mu.is_delete, false) = false
    AND COALESCE(mu.is_readed, false) = true
    AND NOT EXISTS (
      SELECT 1 FROM kpi_security.tb_menu_user ya
      WHERE ya.user_id = mu.user_id
        AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'
        AND COALESCE(ya.is_delete, false) = false
    );
  SELECT count(DISTINCT mr.role_id) INTO huerfanos_rol
  FROM kpi_security.tb_menu_role mr
  WHERE mr.menu_id = '159a5386-ca03-42ca-b12d-b75364ca56d2'
    AND COALESCE(mr.is_delete, false) = false
    AND COALESCE(mr.is_readed, false) = true
    AND NOT EXISTS (
      SELECT 1 FROM kpi_security.tb_menu_role ya
      WHERE ya.role_id = mr.role_id
        AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'
        AND COALESCE(ya.is_delete, false) = false
    );
  IF huerfanos_usuario > 0 OR huerfanos_rol > 0 THEN
    RAISE EXCEPTION 'Quedarian opciones sueltas: % usuarios y % roles con Analisis de Lubricante y sin Configuracion',
      huerfanos_usuario, huerfanos_rol;
  END IF;
  RAISE NOTICE 'Huerfanos tras el pase: % usuarios, % roles.', huerfanos_usuario, huerfanos_rol;
END $$;

COMMIT;
