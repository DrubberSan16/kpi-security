-- ---------------------------------------------------------------------------
-- Menu: Empleados en Configuracion
-- ---------------------------------------------------------------------------
-- Pantalla nueva (`empleados`) con el personal de la empresa: nombres,
-- cedula, sueldo, valor por hora y cargo. Queda al final de Configuracion,
-- tras Terceros (16).
--
-- NO se le asigna a ningun rol ni usuario, a proposito: la pantalla contiene
-- sueldos. Una entrada sin filas en tb_menu_role ni en tb_menu_user la ve
-- SOLO el Super Administrador (el front le entrega el catalogo completo); para
-- abrirla a otro rol basta asignarla desde Roles. Como Configuracion es una
-- seccion que esos roles ya tienen, no hace falta conceder nada mas.
--
-- Idempotente.
--
-- Como deshacerlo:
--   UPDATE kpi_security.tb_menu SET is_deleted = true, status = 'INACTIVE',
--     deleted_at = now(), deleted_by = 'menu-empleados'
--   WHERE url_component = 'empleados';
-- ---------------------------------------------------------------------------

BEGIN;

INSERT INTO kpi_security.tb_menu (
  id, nombre, descripcion, menu_id, url_component, menu_position,
  status, created_by, updated_by, is_deleted, icon
)
SELECT
  gen_random_uuid(),
  'Empleados',
  'Personal de la empresa con su cargo, sueldo y valor por hora.',
  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,  -- Configuracion
  'empleados',
  17,
  'ACTIVE',
  'menu-empleados',
  'menu-empleados',
  false,
  'mdi-account-hard-hat'
WHERE EXISTS (
    SELECT 1 FROM kpi_security.tb_menu
    WHERE id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid
      AND COALESCE(is_deleted, false) = false
  )
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu
    WHERE url_component = 'empleados'
  );

-- Si ya existia pero estaba retirada, se reactiva en su lugar.
UPDATE kpi_security.tb_menu
SET menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid,
    status = 'ACTIVE',
    is_deleted = false,
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = now(),
    updated_by = 'menu-empleados'
WHERE url_component = 'empleados'
  AND (COALESCE(is_deleted, false) = true OR status <> 'ACTIVE');

COMMIT;
