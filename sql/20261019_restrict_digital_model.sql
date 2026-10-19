BEGIN;
SET LOCAL lock_timeout = '10s';
UPDATE kpi_security.tb_menu_user a SET is_delete=true,deleted_at=now(),deleted_by='restrict-digital-model-20261019',
  is_readed=false,is_created=false,is_edited=false,is_deleted=false,is_reports=false,reports_permit=NULL
FROM kpi_security.tb_user u JOIN kpi_security.tb_role r ON r.id=u.role_id
WHERE a.user_id=u.id AND a.menu_id IN (SELECT id FROM kpi_security.tb_menu
  WHERE regexp_replace(lower(coalesce(url_component,'')),'[^a-z]','','g')='gemelosdigitales')
  AND regexp_replace(upper(r.nombre),'[^A-Z]','','g') NOT IN ('SUPERADMINISTRADOR','SUPERADMIN');
UPDATE kpi_security.tb_menu_role a SET is_delete=true,deleted_at=now(),deleted_by='restrict-digital-model-20261019',
  is_readed=false,is_created=false,is_edited=false,is_deleted=false,is_reports=false,reports_permit=NULL
FROM kpi_security.tb_role r WHERE a.role_id=r.id AND a.menu_id IN (SELECT id FROM kpi_security.tb_menu
  WHERE regexp_replace(lower(coalesce(url_component,'')),'[^a-z]','','g')='gemelosdigitales')
  AND regexp_replace(upper(r.nombre),'[^A-Z]','','g') NOT IN ('SUPERADMINISTRADOR','SUPERADMIN');
UPDATE kpi_security.tb_user u SET reportes=(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM jsonb_array_elements(u.reportes) v
  WHERE regexp_replace(lower(v#>>'{}'),'[^a-z]','','g') NOT IN ('gemelosdigitales','digitaltwins','modelodigital'))
FROM kpi_security.tb_role r WHERE r.id=u.role_id AND jsonb_typeof(u.reportes)='array'
  AND regexp_replace(upper(r.nombre),'[^A-Z]','','g') NOT IN ('SUPERADMINISTRADOR','SUPERADMIN')
  AND EXISTS (SELECT 1 FROM jsonb_array_elements(u.reportes) v WHERE regexp_replace(lower(v#>>'{}'),'[^a-z]','','g') IN ('gemelosdigitales','digitaltwins','modelodigital'));
UPDATE kpi_security.tb_role r SET reportes=(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM jsonb_array_elements(r.reportes) v
  WHERE regexp_replace(lower(v#>>'{}'),'[^a-z]','','g') NOT IN ('gemelosdigitales','digitaltwins','modelodigital'))
WHERE jsonb_typeof(r.reportes)='array' AND regexp_replace(upper(r.nombre),'[^A-Z]','','g') NOT IN ('SUPERADMINISTRADOR','SUPERADMIN')
  AND EXISTS (SELECT 1 FROM jsonb_array_elements(r.reportes) v WHERE regexp_replace(lower(v#>>'{}'),'[^a-z]','','g') IN ('gemelosdigitales','digitaltwins','modelodigital'));
-- Super Administrator menu and direct/role assignments are deliberately preserved.
COMMIT;
