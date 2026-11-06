-- Verificación MANUAL de solo lectura; no concede permisos ni cambia roles.
-- Identidad confirmada por el usuario: mildred.navarrete,
-- NAVARRETE ARROYO MILDRED ASUNCION. No se selecciona por correo electrónico.
-- El diagnóstico real del agente coordinador confirmó usuario y rol Administrador
-- activos, lectura/edición de Equipos y lectura de su padre ya concedidas.
-- El problema de la UI se resuelve con el código cuando se despliegue; este
-- archivo no despliega nada y no debe usarse para conceder otra vez el permiso.
-- Si hay duplicados, se muestran todas las asignaciones no borradas y sus flags
-- por separado: no se infiere un permiso efectivo combinando esas filas.
-- Una identidad o menú faltante/ambiguo se señala explícitamente. No se mezclan
-- cuentas ni se elige una identidad arbitraria, incluso entre registros borrados.

BEGIN READ ONLY;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

WITH RECURSIVE
identity_candidates AS (
  SELECT id, name_user, name_surname, role_id, status, is_deleted
  FROM kpi_security.tb_user
  WHERE lower(trim(name_user)) = 'mildred.navarrete'
),
identity_summary AS (
  SELECT count(*) AS identity_count FROM identity_candidates
),
target_user AS (
  SELECT u.* FROM identity_candidates u
  WHERE (SELECT identity_count FROM identity_summary) = 1
),
equipment_candidates AS (
  SELECT id FROM kpi_security.tb_menu
  WHERE url_component = 'equipos' AND is_deleted = false
),
equipment_summary AS (
  SELECT count(*) AS equipment_menu_count FROM equipment_candidates
),
navigation AS (
  SELECT m.id, m.menu_id, m.nombre, m.url_component, m.status, m.is_deleted
  FROM kpi_security.tb_menu m
  JOIN equipment_candidates e ON e.id = m.id
  WHERE (SELECT equipment_menu_count FROM equipment_summary) = 1
  UNION
  SELECT m.id, m.menu_id, m.nombre, m.url_component, m.status, m.is_deleted
  FROM kpi_security.tb_menu m
  JOIN navigation child ON child.menu_id = m.id
),
grant_counts AS (
  SELECT mu.menu_id, count(*) AS assignment_count
  FROM kpi_security.tb_menu_user mu
  JOIN target_user u ON u.id = mu.user_id
  JOIN navigation n ON n.id = mu.menu_id
  WHERE mu.is_delete = false
  GROUP BY mu.menu_id
)
SELECT
  identity_summary.identity_count,
  CASE identity_summary.identity_count
    WHEN 0 THEN 'IDENTIDAD_NO_ENCONTRADA'
    WHEN 1 THEN 'IDENTIDAD_UNICA'
    ELSE 'IDENTIDAD_AMBIGUA_NO_SELECCIONADA'
  END AS identity_diagnostic,
  u.id AS user_id, u.name_user AS username, u.name_surname AS nombre,
  u.status AS user_status, u.is_deleted AS user_is_deleted,
  (u.status = 'ACTIVE' AND u.is_deleted = false) AS user_active,
  r.id AS role_id, r.nombre AS role_name, r.status AS role_status,
  r.is_deleted AS role_is_deleted,
  (r.status = 'ACTIVE' AND r.is_deleted = false) AS role_active,
  equipment_summary.equipment_menu_count,
  CASE equipment_summary.equipment_menu_count
    WHEN 0 THEN 'MENU_EQUIPOS_NO_ENCONTRADO'
    WHEN 1 THEN 'MENU_EQUIPOS_UNICO'
    ELSE 'MENU_EQUIPOS_AMBIGUO_NO_SELECCIONADO'
  END AS equipment_diagnostic,
  n.id AS menu_id, n.nombre AS menu_name, n.url_component,
  n.status AS menu_status, n.is_deleted AS menu_is_deleted,
  n.menu_id AS parent_menu_id,
  (n.menu_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu parent WHERE parent.id = n.menu_id
  )) AS parent_menu_missing,
  coalesce(gc.assignment_count, 0) AS assignment_count,
  CASE
    WHEN u.id IS NULL THEN 'SIN_IDENTIDAD_UNICA'
    WHEN n.id IS NULL THEN 'SIN_MENU_UNICO'
    WHEN coalesce(gc.assignment_count, 0) = 0 THEN 'SIN_ASIGNACION_NO_BORRADA'
    WHEN gc.assignment_count = 1 THEN 'ASIGNACION_UNICA_REVISAR_FLAGS'
    ELSE 'ASIGNACIONES_DUPLICADAS_NO_INFERIR_PERMISO'
  END AS assignment_diagnostic,
  mu.id AS assignment_id, mu.status AS assignment_status,
  mu.is_delete AS assignment_is_deleted,
  mu.is_readed, mu.is_edited, mu.is_created,
  mu.is_deleted AS permite_eliminar, mu.is_reports
FROM identity_summary
CROSS JOIN equipment_summary
LEFT JOIN target_user u ON true
LEFT JOIN kpi_security.tb_role r ON r.id = u.role_id
LEFT JOIN navigation n ON true
LEFT JOIN grant_counts gc ON gc.menu_id = n.id
LEFT JOIN kpi_security.tb_menu_user mu
  ON mu.user_id = u.id AND mu.menu_id = n.id AND mu.is_delete = false
ORDER BY n.url_component NULLS LAST, n.id, mu.id;

COMMIT;

-- Lectura del resultado:
-- user_active y role_active deben ser true para la identidad única confirmada.
-- Equipos requiere una asignación no borrada con lectura/edición; sus ancestros,
-- lectura. Revisar cada flag de cada fila; un duplicado necesita diagnóstico.
-- is_delete borra la asignación; is_deleted en esa tabla permite eliminar.
-- getMenuTreeByUser no filtra status de la asignación, pero aquí se expone.
-- UNION evita recursión infinita incluso si los menús contienen un ciclo.
