import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Kiwi Latino <psfuentesc@gmail.com>';

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Recupera tu contraseña · Kiwi Latino',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#1a6b3c;margin-bottom:8px">Kiwi Latino 🥝</h2>
        <p style="color:#374151">Hola <strong>${name}</strong>,</p>
        <p style="color:#374151">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para continuar:</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1a6b3c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280;font-size:14px">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">Kiwi Latino · Comunidad latina en Nueva Zelanda</p>
      </div>
    `,
  });
}
