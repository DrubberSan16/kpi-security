-- ---------------------------------------------------------------------------
-- Unidades de Generacion y Otros Equipos pasan de Mantenimiento a Configuracion
-- ---------------------------------------------------------------------------
-- El registro de equipos es un maestro que se define una vez, no una pantalla
-- de operacion: va con Marcas y Tipos de Equipo, que son sus catalogos, y deja
-- en Mantenimiento solo lo que se trabaja a diario (programacion y ordenes).
--
-- Configuracion queda: ... Unidades (9), Marcas (10), Tipos de Equipo (11),
-- Unidades de Generacion (12), Otros Equipos (13) y Plantillas (14).
-- Mantenimiento se renumera sin huecos: Proyectos (1), Programacion (2),
-- Ordenes de Trabajo (3), OT. Proyecto (4) y Terceros (5).
--
-- NINGUN `url_component` cambia, asi que ningun permiso del codigo se mueve:
-- se resuelven por componente, no por la seccion donde cuelga la entrada.
--
-- La trampa de siempre al mover una entrada: `getMenuTreeByUser` arma el arbol
-- solo con los menus asignados y engancha por `menu_id`, y quien tiene el hijo
-- pero no el padre nuevo lo ve suelto en la raiz. El 2026-09-21 los 31 usuarios
-- y 6 roles que tienen estas dos entradas ya tenian lectura de Configuracion;
-- el bloque 2 lo garantiza igual por si eso cambia antes de correrlo.
--
-- Idempotente.
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Nueva ubicacion y orden
-- ===========================================================================
UPDATE kpi_security.tb_menu AS m
SET menu_id = destino.padre,
    menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-equipos-configuracion'
FROM (
  VALUES
    -- Configuracion
    ('7944e1e6-9fa5-478e-ab7b-9bf7649fd312'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 12),  -- Unidades de Generación
    ('91b25954-b2fe-4653-809d-7d146a153923'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 13),  -- Otros Equipos
    ('c1d84579-6dfa-4093-8a13-f956c82dbd30'::uuid, 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 14),  -- Plantillas

    -- Mantenimiento
    ('a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  1),  -- Proyectos
    ('2df82c17-6610-4be0-bae3-2e0d3eb6e663'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  2),  -- Programación
    ('3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  3),  -- Ordenes de Trabajo
    ('1959cd98-a312-4648-84d2-08046f57a727'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  4),  -- OT. Proyecto
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 'ca559bc5-a8aa-47fc-9521-fe85f384044d'::uuid,  5)   -- Terceros
) AS destino(id, padre, posicion)
WHERE m.id = destino.id;

-- ===========================================================================
-- 2. Nadie ve las entradas sueltas en la raiz por no tener el padre asignado
-- ===========================================================================
-- Se concede LECTURA de Configuracion a quien tenga cualquiera de las dos
-- entradas movidas. Una seccion es solo navegacion: no da acceso a ninguna
-- pantalla por si misma.
INSERT INTO kpi_security.tb_menu_user (
  id, user_id, menu_id, status, created_by, updated_by, is_delete,
  is_readed, is_created, is_edited, is_deleted, is_reports
)
SELECT DISTINCT ON (origen.user_id)
  gen_random_uuid(), origen.user_id,
  'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid, 'ACTIVE',
  'menu-equipos-configuracion', 'menu-equipos-configuracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_user origen
WHERE origen.menu_id IN (
    '7944e1e6-9fa5-478e-ab7b-9bf7649fd312'::uuid,
    '91b25954-b2fe-4653-809d-7d146a153923'::uuid
  )
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
  'menu-equipos-configuracion', 'menu-equipos-configuracion', false,
  true, false, false, false, false
FROM kpi_security.tb_menu_role origen
WHERE origen.menu_id IN (
    '7944e1e6-9fa5-478e-ab7b-9bf7649fd312'::uuid,
    '91b25954-b2fe-4653-809d-7d146a153923'::uuid
  )
  AND COALESCE(origen.is_delete, false) = false
  AND COALESCE(origen.is_readed, false) = true
  AND NOT EXISTS (
    SELECT 1 FROM kpi_security.tb_menu_role ya
    WHERE ya.role_id = origen.role_id
      AND ya.menu_id = 'd1f0a7c4-9b2e-4c65-8f31-5a6e0c7b1d20'::uuid
      AND COALESCE(ya.is_delete, false) = false
  );

COMMIT;
