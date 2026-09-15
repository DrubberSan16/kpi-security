-- ---------------------------------------------------------------------------
-- Proyectos va junto a Unidades de Generacion, no al final de Mantenimiento
-- ---------------------------------------------------------------------------
-- Un proyecto es un equipo cuyo tipo es "Proyectos": mismo registro y misma
-- pantalla que una unidad de generacion, solo cambia el grupo que consulta.
-- Siendo la misma clase de entrada, va al lado y no separada por Programacion
-- y Ordenes de Trabajo.
--
-- Su descripcion tambien cambia: dejo de ser una pantalla pendiente.
--
-- Idempotente.
-- ---------------------------------------------------------------------------

BEGIN;

UPDATE kpi_security.tb_menu AS m
SET menu_position = destino.posicion,
    updated_at = now(),
    updated_by = 'menu-proyectos-orden'
FROM (
  VALUES
    ('7944e1e6-9fa5-478e-ab7b-9bf7649fd312'::uuid, 1),  -- Unidades de Generación
    ('a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid, 2),  -- Proyectos
    ('91b25954-b2fe-4653-809d-7d146a153923'::uuid, 3),  -- Otros Equipos
    ('2df82c17-6610-4be0-bae3-2e0d3eb6e663'::uuid, 4),  -- Programación
    ('3320a78e-a059-4ef2-8cc7-337e047a3b1e'::uuid, 5),  -- Ordenes de Trabajo
    ('18fa227e-6498-47a7-b57d-a110e6c65612'::uuid, 6)   -- Terceros
) AS destino(id, posicion)
WHERE m.id = destino.id;

UPDATE kpi_security.tb_menu
SET descripcion = 'Equipos cuyo tipo es Proyectos.',
    icon = 'mdi-engine-outline',
    updated_at = now(),
    updated_by = 'menu-proyectos-orden'
WHERE id = 'a4b8d61c-3e57-4f92-8c04-9d2a7e5b3f60'::uuid;

COMMIT;
