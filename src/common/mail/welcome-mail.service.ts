import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type WelcomeMailInput = {
  email: string;
  nameUser: string;
  displayName?: string | null;
  roleName?: string | null;
};

/**
 * Correo de bienvenida al alta de un usuario.
 *
 * Reutiliza el mismo bloque SMTP que el resto de la suite, de modo que el .env
 * de este servicio puede copiar tal cual el de kpi-maintenance. Si el
 * transporte no está configurado, el alta del usuario continúa con normalidad:
 * el correo nunca debe bloquear la operación de origen.
 *
 * La contraseña no viaja nunca en este mensaje; la entrega el administrador
 * por un canal aparte.
 */
@Injectable()
export class WelcomeMailService {
  private readonly logger = new Logger(WelcomeMailService.name);
  private transporter: Transporter | null = null;
  private transportVerified = false;

  private readonly fromAddress = String(
    process.env.WELCOME_EMAIL_FROM ||
      process.env.ALERT_EMAIL_FROM ||
      process.env.MAIL_FROM_ADDRESS ||
      process.env.SMTP_FROM_EMAIL ||
      '',
  ).trim();

  private readonly fromName = String(
    process.env.WELCOME_EMAIL_FROM_NAME ||
      process.env.ALERT_EMAIL_FROM_NAME ||
      process.env.MAIL_FROM_NAME ||
      'Justice KPI',
  ).trim();

  private readonly publicBaseUrl = String(
    process.env.PUBLIC_BASE_URL || process.env.APP_PUBLIC_URL || '',
  )
    .trim()
    .replace(/\/$/, '');

  private coerceBoolean(value: unknown, fallback: boolean) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized) return fallback;
    return ['1', 'true', 'yes', 'y', 'si', 'sí'].includes(normalized);
  }

  private async getTransporter() {
    if (this.transporter) return this.transporter;

    const host = String(
      process.env.WELCOME_SMTP_HOST ||
        process.env.ALERT_SMTP_HOST ||
        process.env.SMTP_HOST ||
        process.env.MAIL_HOST ||
        '',
    ).trim();
    const port = Number(
      process.env.WELCOME_SMTP_PORT ||
        process.env.ALERT_SMTP_PORT ||
        process.env.SMTP_PORT ||
        process.env.MAIL_PORT ||
        587,
    );
    const user = String(
      process.env.WELCOME_SMTP_USER ||
        process.env.ALERT_SMTP_USER ||
        process.env.SMTP_USER ||
        process.env.MAIL_USER ||
        '',
    ).trim();
    const pass = String(
      process.env.WELCOME_SMTP_PASS ||
        process.env.ALERT_SMTP_PASS ||
        process.env.SMTP_PASS ||
        process.env.MAIL_PASS ||
        '',
    ).trim();
    const secure = this.coerceBoolean(
      process.env.WELCOME_SMTP_SECURE ||
        process.env.ALERT_SMTP_SECURE ||
        process.env.SMTP_SECURE ||
        process.env.MAIL_SECURE,
      port === 465,
    );

    if (!host || !port || !this.fromAddress) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    if (!this.transportVerified) {
      try {
        await this.transporter.verify();
        this.transportVerified = true;
      } catch (error: any) {
        this.logger.warn(
          `No se pudo verificar el transporte SMTP de bienvenida: ${error?.message ?? 'desconocido'}`,
        );
      }
    }

    return this.transporter;
  }

  private escapeHtml(value: unknown) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private normalizeEmail(value: unknown) {
    const normalized = String(value ?? '').trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
  }

  private buildHtml(input: WelcomeMailInput) {
    const displayName =
      String(input.displayName || '').trim() || input.nameUser;
    const loginUrl = this.publicBaseUrl || null;
    const accent = '#245b84';

    const steps = [
      {
        icon: '1',
        title: 'Guarda tu usuario',
        body: 'Lo necesitarás cada vez que ingreses. Aparece más abajo en esta misma tarjeta.',
      },
      {
        icon: '2',
        title: 'Solicita tu contraseña',
        body: 'Por seguridad no viaja en este correo. El administrador te la entrega directamente.',
      },
      {
        icon: '3',
        title: 'Entra y explora',
        body: 'Verás únicamente los módulos habilitados para tu perfil.',
      },
    ];

    return `<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Bienvenido a Justice KPI</title>
        </head>
        <body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#17324d;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef3f8;">
            <tr>
              <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #dce5ef;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(20,48,75,.10);">
                  <tr>
                    <td style="padding:34px 32px 26px;background-color:${accent};background:linear-gradient(135deg,#245b84 0%,#17415f 100%);">
                      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#bcd8ec;">Justice KPI</div>
                      <h1 style="margin:10px 0 8px;font-size:29px;line-height:1.2;color:#ffffff;">Te damos la bienvenida</h1>
                      <p style="margin:0;font-size:15px;line-height:1.6;color:#d6e7f4;">
                        Hola <strong style="color:#ffffff;">${this.escapeHtml(displayName)}</strong>, tu acceso a la plataforma ya está creado.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:28px 32px 6px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #dce5ef;border-radius:14px;background:#f7fafd;">
                        <tr>
                          <td style="padding:20px 22px;">
                            <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#60778d;">Tu usuario de acceso</div>
                            <div style="margin-top:8px;font-size:24px;font-weight:800;letter-spacing:.02em;color:${accent};font-family:'Courier New',Courier,monospace;">${this.escapeHtml(input.nameUser)}</div>
                            ${
                              input.roleName
                                ? `<div style="margin-top:10px;display:inline-block;padding:5px 11px;border-radius:999px;background:#e4eef6;font-size:12px;font-weight:700;color:#2c5f85;">Perfil: ${this.escapeHtml(input.roleName)}</div>`
                                : ''
                            }
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 32px 4px;">
                      <div style="padding:14px 16px;border-left:4px solid #e0a800;background:#fff8e6;border-radius:10px;font-size:13.5px;line-height:1.6;color:#6b5100;">
                        <strong>Tu contraseña no viaja en este correo.</strong> Por seguridad, el administrador del sistema te la entregará directamente.
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:24px 32px 8px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#60778d;margin-bottom:14px;">Cómo empezar</div>
                      ${steps
                        .map(
                          (step) => `
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-bottom:12px;">
                          <tr>
                            <td width="38" valign="top" style="width:38px;">
                              <div style="width:28px;height:28px;border-radius:50%;background:${accent};color:#ffffff;font-size:13px;font-weight:800;text-align:center;line-height:28px;">${step.icon}</div>
                            </td>
                            <td valign="top" style="padding-left:6px;">
                              <div style="font-size:14.5px;font-weight:700;color:#17324d;">${this.escapeHtml(step.title)}</div>
                              <div style="font-size:13.5px;line-height:1.55;color:#5a728a;margin-top:2px;">${this.escapeHtml(step.body)}</div>
                            </td>
                          </tr>
                        </table>`,
                        )
                        .join('')}
                    </td>
                  </tr>

                  ${
                    loginUrl
                      ? `<tr>
                          <td style="padding:14px 32px 30px;text-align:center;">
                            <a href="${this.escapeHtml(loginUrl)}" style="display:inline-block;padding:14px 30px;border-radius:9px;background:${accent};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">Ingresar a Justice KPI</a>
                          </td>
                        </tr>`
                      : '<tr><td style="padding:0 32px 26px;"></td></tr>'
                  }

                  <tr>
                    <td style="padding:18px 32px;background:#f7f9fc;border-top:1px solid #e4ebf3;font-size:12px;line-height:1.55;color:#687d91;">
                      Mensaje automático de Justice KPI. Si no esperabas este correo, avisa al administrador del sistema.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;
  }

  private buildText(input: WelcomeMailInput) {
    const displayName =
      String(input.displayName || '').trim() || input.nameUser;
    return [
      `Hola ${displayName},`,
      '',
      'Te damos la bienvenida a Justice KPI. Tu acceso ya está creado.',
      '',
      `Usuario: ${input.nameUser}`,
      input.roleName ? `Perfil: ${input.roleName}` : '',
      '',
      'Tu contraseña no viaja en este correo: el administrador del sistema te la entregará directamente.',
      '',
      this.publicBaseUrl ? `Ingresar: ${this.publicBaseUrl}` : '',
      '',
      'Si no esperabas este correo, avisa al administrador del sistema.',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  /**
   * Envía la bienvenida. Nunca lanza: un fallo de correo no debe impedir el
   * alta del usuario.
   */
  async sendWelcomeEmail(input: WelcomeMailInput) {
    const email = this.normalizeEmail(input.email);
    if (!email) {
      return { sent: false, reason: 'invalid-email' as const };
    }

    try {
      const transporter = await this.getTransporter();
      if (!transporter) {
        this.logger.warn(
          `[WelcomeEmail] SMTP no configurado; no se envió la bienvenida a ${email}.`,
        );
        return { sent: false, reason: 'smtp-not-configured' as const };
      }

      await transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: email,
        subject: '¡Bienvenido a Justice KPI! Tu acceso ya está listo',
        html: this.buildHtml({ ...input, email }),
        text: this.buildText({ ...input, email }),
      });
      this.logger.log(`[WelcomeEmail] Enviado a ${email}.`);
      return { sent: true as const };
    } catch (error: any) {
      this.logger.warn(
        `[WelcomeEmail] Fallo envío a ${email}: ${error?.message ?? 'desconocido'}`,
      );
      return { sent: false, reason: 'send-failed' as const };
    }
  }
}
