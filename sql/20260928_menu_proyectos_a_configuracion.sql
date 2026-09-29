-- ---------------------------------------------------------------------------
-- Proyectos pasa de Mantenimiento/Transacciones a Configuracion
-- ---------------------------------------------------------------------------
-- Un proyecto es un registro de Equipos cuyo tipo es "Proyectos": se define una
-- vez, igual que las Unidades de Generacion y los Otros Equipos, y no es una
-- pantalla de operacion diaria. Va con ellos, en Configuracion.
--
-- Configuracion queda: ... Tipos de Equipo (11), Unidades de Generacion (12),
-- Proyectos (13), Otros Equipos (14) y Plantillas (15). Las tres entradas de
-- equipos van juntas y en el orden en que el listado las separa: generacion,
-- proyectos y, al final, el resto.
-- Mantenimiento/Transacciones se renumera sin huecos: Programacion (1),
-- Ordenes de Trabajo (2), OT. Proyecto (3) y Terceros (4).
--
-- NINGUN `url_component` cambia (Proyectos sigue siendo `proyectos`), asi que
-- ningun permiso del codigo se mueve: se resuelven por componente, no por la
-- seccion donde cuelga la entrada. Los permisos que cada rol y usuario tiene
-- sobre Proyectos viajan con la fila del menu.
--
-- La trampa de siempre al mover una entrada: `getMenuTreeByUser` arma el arbol
-- solo con los menus asignados y engancha por `menu_id`, y quien tiene el hijo
-- pero no el padre nuevo lo ve suelto en la raiz. El 2026-09-28 los 5 roles y
-- 30 usuarios que tienen Proyectos ya tenian lectura de Configuracion; el
-- bloque 2 lo garantiza igual por si eso cambia antes de correrlo.
--
-- Idempotente.
--
-- Como deshacerlo (estado del 2026-09-28 antes de aplicarlo):
--   Proyectos a4b8d61c -> Mantenimiento/Transacciones ca559bc5, posicion 1
--   Programacion 2df82c17 -> 2, Ordenes de Trabajo 3320a78e -> 3,
--   OT. Proyecto 1959cd98 -> 4, Terceros 18fa227e -> 5 (todas en ca559bc5)
--   Otros Equipos 91b25954 -> Configuracion d1f0a7c4, posicion 13
--   Plantillas c1d84579 -> Configuracion d1f0a7c4, posicion 14
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Nueva ubicacion y orden
-- ===========================================================================
UPDATE kpi_security.tb_menu AS m
SET menu_id = destino.padre,
    menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-proyectos-configuracion'
FROM (
  VALUES
    -- Configuracion
    ('a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 13),  -- Proyectos
    ('91b25954-b2fe-4653-809d-7d146a153923'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 14),  -- Otros Equipos
    ('c1d84579-6dfa-4093-8a13-f956c82dbd30'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 15),  -- Plantillas

    -- Mantenimiento/Transacciones
    ('2df82c17-6610-4be0-bae3-2e0d3eb6e663'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  1),  -- Programación
    ('3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  2),  -- Ordenes de Trabajo
    ('1959cd98-a312-4648-84d2-08046f57a727'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  3),  -- OT. Proyecto
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  4)   -- Terceros
) AS destino(id, padre, posicion)
WHERE m.id = destino.id;

-- ===========================================================================
-- 2. Nadie ve la entrada suelta en la raiz por no tener el padre asignado
-- ===========================================================================
-- Se concede LECTURA de Configuracion a quien tenga Proyectos. Una seccion es
-- solo navegacion: no da acceso a ninguna pantalla por si misma.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (origen.user_id)
  gen_random_uuid(), origen.user_id,
  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 'ACTIVE',
  'menu-proyectos-configuracion', 'menu-proyectos-configuracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
WHERE origen.menu_id = 'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_user ya
    WHERE ya.user_id = origen.user_id
      AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

INSERT INTO kpi_security.tb_menu_role (
  id, role_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (origen.role_id)
  gen_random_uuid(), origen.role_id,
  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 'ACTIVE',
  'menu-proyectos-configuracion', 'menu-proyectos-configuracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
WHERE origen.menu_id = 'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

COMMIT;
