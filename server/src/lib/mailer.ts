import nodemailer, { type Transporter } from "nodemailer";

const TRACKING_URL = "https://www.correoargentino.com.ar/seguimiento";

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendTrackingEmail(params: {
  to: string;
  name: string;
  orderId: string;
  trackingCode: string;
}) {
  const { to, name, orderId, trackingCode } = params;
  const orderShort = orderId.slice(-8).toUpperCase();
  const from = process.env.SMTP_FROM || "MLM <no-reply@mlm.com>";

  const subject = `Tu pedido #${orderShort} fue despachado`;
  const text = `Hola ${name},\n\nTu pedido #${orderShort} ya fue despachado con Correo Argentino.\n\nCodigo de seguimiento: ${trackingCode}\n\nPodes seguirlo en ${TRACKING_URL} usando ese codigo.\n\nGracias por tu compra.\nMLM`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0a0a0a; max-width: 480px;">
      <p>Hola ${name},</p>
      <p>Tu pedido <strong>#${orderShort}</strong> ya fue despachado con <strong>Correo Argentino</strong>.</p>
      <p style="margin: 24px 0; padding: 16px; border: 1px solid #ddd; text-align: center;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666;">Codigo de seguimiento</span>
        <br />
        <span style="font-size: 20px; font-weight: bold;">${trackingCode}</span>
      </p>
      <p>
        Podes rastrear tu envio en
        <a href="${TRACKING_URL}" target="_blank" rel="noopener">${TRACKING_URL}</a>
        usando ese codigo.
      </p>
      <p>Gracias por tu compra.<br />MLM</p>
    </div>
  `;

  if (!isMailConfigured()) {
    console.log(`[mailer] SMTP no configurado. Simulando envio a ${to}: codigo ${trackingCode} (pedido #${orderShort})`);
    return;
  }

  await getTransporter().sendMail({ from, to, subject, text, html });
}

export async function sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }) {
  const { to, name, resetUrl } = params;
  const from = process.env.SMTP_FROM || "MLM <no-reply@mlm.com>";

  const subject = "Restablecer tu contrasena";
  const text = `Hola ${name},\n\nRecibimos un pedido para restablecer tu contrasena.\n\nEntra a este link para elegir una nueva (valido por 1 hora):\n${resetUrl}\n\nSi no fuiste vos, ignora este email.\n\nMLM`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0a0a0a; max-width: 480px;">
      <p>Hola ${name},</p>
      <p>Recibimos un pedido para restablecer tu contrasena.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" target="_blank" rel="noopener" style="display: inline-block; padding: 12px 20px; background: #0a0a0a; color: #f5f5f2; text-decoration: none;">
          Elegir nueva contrasena
        </a>
      </p>
      <p>El link es valido por 1 hora. Si no fuiste vos, ignora este email.</p>
      <p>MLM</p>
    </div>
  `;

  if (!isMailConfigured()) {
    console.log(`[mailer] SMTP no configurado. Simulando envio a ${to}: ${resetUrl}`);
    return;
  }

  await getTransporter().sendMail({ from, to, subject, text, html });
}
