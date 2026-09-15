#!/usr/bin/env node
/**
 * Aviso a cada usuario de donde quedaron sus pantallas tras seccionar el menu.
 *
 * Es un script de una sola vez, no una funcion del producto: se ejecuta desde el
 * servidor de aplicaciones, que es donde viven las credenciales de la base y del
 * SMTP en el `.env` de cada componente.
 *
 * El arbol se calcula IGUAL que `getMenuTreeByUser`: solo `tb_menu_user` con
 * lectura, sin mezclar los permisos de rol. Si se calculara de otra forma, el
 * correo diria una cosa y la pantalla mostraria otra.
 *
 * Uso:
 *   ENV_FILES=a.env,b.env node notificar-menu.cjs --preview [usuario]
 *   ENV_FILES=a.env,b.env node notificar-menu.cjs --send
 *
 * Sin `--send` NO envia nada.
 */
const fs = require('fs');
const { Client } = require('pg');
const nodemailer = require('nodemailer');

const args = process.argv.slice(2);
const MODO_ENVIO = args.includes('--send');
const objetivoPreview = (() => {
  const i = args.indexOf('--preview');
  if (i === -1) return null;
  return args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
})();

const SALTO_DE_LINEA = new RegExp('\\r?\\n');

/**
 * Carga los `.env` sin pasar por el shell.
 *
 * `source` sobre estos ficheros falla: hay valores con espacios sin comillas
 * (nombres de remitente, asuntos) y bash intenta ejecutarlos como comandos.
 */
function cargarEnv(ruta) {
  let contenido;
  try {
    contenido = fs.readFileSync(ruta, 'utf8');
  } catch {
    return;
  }
  for (const linea of contenido.split(SALTO_DE_LINEA)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const corte = limpia.indexOf('=');
    if (corte <= 0) continue;
    const clave = limpia.slice(0, corte).trim();
    let valor = limpia.slice(corte + 1).trim();
    const entrecomillado =
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"));
    if (entrecomillado) valor = valor.slice(1, -1);
    // El primero que define una clave manda.
    if (!process.env[clave]) process.env[clave] = valor;
  }
}

for (const ruta of String(process.env.ENV_FILES || '').split(',').filter(Boolean)) {
  cargarEnv(ruta.trim());
}

function env(...nombres) {
  for (const nombre of nombres) {
    const valor = String(process.env[nombre] || '').trim();
    if (valor) return valor;
  }
  return '';
}

const escapeHtml = (valor) =>
  String(valor ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------
const CONSULTA = `
  SELECT
    u.id                                   AS user_id,
    u.name_user                            AS usuario,
    COALESCE(u.name_surname, u.name_user)  AS nombre,
    lower(trim(u.email))                   AS email,
    seccion.nombre                         AS seccion,
    pantalla.nombre                        AS pantalla
  FROM kpi_security.tb_menu_user mu
  JOIN kpi_security.tb_user u
    ON u.id = mu.user_id
   AND COALESCE(u.is_deleted, false) = false
   AND upper(COALESCE(u.status, 'ACTIVE')) = 'ACTIVE'
   AND u.email IS NOT NULL
   AND trim(u.email) <> ''
  JOIN kpi_security.tb_menu pantalla
    ON pantalla.id = mu.menu_id
   AND COALESCE(pantalla.is_deleted, false) = false
   AND pantalla.menu_id IS NOT NULL
  JOIN kpi_security.tb_menu seccion
    ON seccion.id = pantalla.menu_id
   AND COALESCE(seccion.is_deleted, false) = false
  WHERE COALESCE(mu.is_delete, false) = false
    AND COALESCE(mu.is_readed, false) = true
  ORDER BY u.name_user, seccion.menu_position, pantalla.menu_position, pantalla.nombre
`;

async function cargarUsuarios(client) {
  const { rows } = await client.query(CONSULTA);
  const porUsuario = new Map();
  for (const row of rows) {
    if (!porUsuario.has(row.user_id)) {
      porUsuario.set(row.user_id, {
        usuario: row.usuario,
        nombre: row.nombre,
        email: row.email,
        secciones: new Map(),
      });
    }
    const usuario = porUsuario.get(row.user_id);
    if (!usuario.secciones.has(row.seccion)) usuario.secciones.set(row.seccion, []);
    usuario.secciones.get(row.seccion).push(row.pantalla);
  }
  return [...porUsuario.values()];
}

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------
const ASUNTO = '[Justice KPI] El menu se reorganizo: donde quedaron tus pantallas';

function construirHtml(usuario) {
  const bloques = [...usuario.secciones.entries()]
    .map(
      ([seccion, pantallas]) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e5ecf3;width:34%;vertical-align:top;background:#f6f9fc;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#60778d;">${escapeHtml(seccion)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5ecf3;font-size:14px;color:#17324d;line-height:1.7;">${pantallas
            .map((p) => escapeHtml(p))
            .join('<br>')}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#eef2f7;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dce5ef;">
    <div style="padding:20px 24px;background:#245b84;color:#ffffff;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Justice KPI</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px;">El men&uacute; se reorganiz&oacute;</div>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#405a70;">
        Hola <strong>${escapeHtml(usuario.nombre)}</strong>. El men&uacute; se dividi&oacute; en secciones para separar lo que se
        configura una sola vez de lo que se usa a diario. <strong>Tus accesos no cambiaron</strong>: son los mismos de
        siempre, solo que ahora est&aacute;n agrupados de otra forma.
      </p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#405a70;">As&iacute; queda tu men&uacute;:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
             style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #dce5ef;border-radius:12px;overflow:hidden;">
        ${bloques}
      </table>
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#60778d;">
        Si no ves alguna opci&oacute;n que usabas, av&iacute;sale a tu administrador y la revisamos.
      </p>
    </div>
  </div>
</body></html>`;
}

function construirTexto(usuario) {
  const lineas = [
    `Hola ${usuario.nombre}.`,
    '',
    'El menu se dividio en secciones para separar lo que se configura una sola',
    'vez de lo que se usa a diario. Tus accesos NO cambiaron: son los mismos de',
    'siempre, solo que ahora estan agrupados de otra forma.',
    '',
    'Asi queda tu menu:',
    '',
  ];
  for (const [seccion, pantallas] of usuario.secciones) {
    lineas.push(String(seccion).toUpperCase());
    for (const pantalla of pantallas) lineas.push(`  - ${pantalla}`);
    lineas.push('');
  }
  lineas.push('Si no ves alguna opcion que usabas, avisale a tu administrador y la revisamos.');
  return lineas.join('\n');
}

// ---------------------------------------------------------------------------
// Ejecucion
// ---------------------------------------------------------------------------
async function main() {
  const client = new Client({
    host: env('DB_HOST', 'POSTGRES_HOST'),
    port: Number(env('DB_PORT', 'POSTGRES_PORT') || 5432),
    user: env('DB_USER', 'POSTGRES_USER'),
    password: env('DB_PASS', 'DB_PASSWORD', 'POSTGRES_PASSWORD'),
    database: env('DB_NAME', 'POSTGRES_DB'),
    // pg_hba exige conexion cifrada; el certificado es interno y autofirmado,
    // igual que en la conexion que usa la propia aplicacion.
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const usuarios = await cargarUsuarios(client);
  await client.end();

  if (!usuarios.length) {
    console.error('No se encontraron usuarios con permisos de lectura.');
    process.exit(1);
  }

  if (objetivoPreview !== null) {
    const buscado = String(objetivoPreview).toLowerCase();
    const elegido =
      usuarios.find(
        (u) => String(u.usuario).toLowerCase() === buscado || u.email === buscado,
      ) ?? usuarios[0];
    console.log('===== DESTINATARIO =====');
    console.log(`${elegido.nombre} <${elegido.email}>  (usuario: ${elegido.usuario})`);
    console.log(`Asunto: ${ASUNTO}`);
    console.log('');
    console.log('===== CUERPO =====');
    console.log(construirTexto(elegido));
    console.log('===== FIN =====');
    console.log('');
    console.log(`Se enviaria a ${usuarios.length} usuarios.`);
    return;
  }

  if (!MODO_ENVIO) {
    console.log('Sin --send no se envia nada. Usa --preview o --send.');
    return;
  }

  const host = env('ALERT_SMTP_HOST', 'SMTP_HOST', 'MAIL_HOST');
  const port = Number(env('ALERT_SMTP_PORT', 'SMTP_PORT', 'MAIL_PORT') || 587);
  const user = env('ALERT_SMTP_USER', 'SMTP_USER', 'MAIL_USER');
  const pass = env('ALERT_SMTP_PASS', 'SMTP_PASS', 'MAIL_PASS');
  const secure =
    String(env('ALERT_SMTP_SECURE', 'SMTP_SECURE', 'MAIL_SECURE')).toLowerCase() ===
      'true' || port === 465;

  if (!host || !user || !pass) {
    console.error('SMTP no configurado en el .env; no se envia nada.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  const remitente = env('ALERT_MAIL_FROM', 'MAIL_FROM') || user;

  let enviados = 0;
  let fallidos = 0;
  for (const usuario of usuarios) {
    try {
      await transporter.sendMail({
        from: `"Justice KPI" <${remitente}>`,
        to: usuario.email,
        subject: ASUNTO,
        html: construirHtml(usuario),
        text: construirTexto(usuario),
      });
      enviados += 1;
      console.log(`OK    ${usuario.email}`);
    } catch (error) {
      fallidos += 1;
      console.error(`FALLO ${usuario.email}: ${error?.message ?? 'desconocido'}`);
    }
  }
  console.log(`\nEnviados: ${enviados} | Fallidos: ${fallidos} | Total: ${usuarios.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
