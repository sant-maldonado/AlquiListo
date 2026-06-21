import fetch from 'node-fetch';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SIMULADO] Para: ${to}`);
    console.log(`[EMAIL SIMULADO] Asunto: ${subject}`);
    console.log(`[EMAIL SIMULADO] Cuerpo: ${html.replace(/<[^>]*>/g, '').substring(0, 200)}...`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[EMAIL ERROR]', err);
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
}

export const EmailService = {
  sendGuarantorInvite(guarantorEmail, guarantorName, inviteLink) {
    sendEmail({
      to: guarantorEmail,
      subject: 'Te invitaron a ser garante en AlquiListo',
      html: `<p>Hola ${guarantorName},</p><p>Te invitaron a ser garante en AlquiListo.</p><p>Hacé clic <a href="${inviteLink}">acá</a> para completar tu información.</p>`,
    });
  },

  sendNewApplication(ownerEmail, ownerName, propertyTitle, tenantName) {
    sendEmail({
      to: ownerEmail,
      subject: 'Nueva postulación en AlquiListo',
      html: `<p>Hola ${ownerName},</p><p>${tenantName} se postuló para alquilar <strong>${propertyTitle}</strong>.</p><p>Ingresá a tu panel en <a href="${FRONTEND_URL}">AlquiListo</a> para revisar su perfil.</p>`,
    });
  },

  sendApplicationAccepted(tenantEmail, tenantName, propertyTitle) {
    sendEmail({
      to: tenantEmail,
      subject: '¡Tu postulación fue aceptada!',
      html: `<p>Hola ${tenantName},</p><p>¡Felicitaciones! Tu postulación para <strong>${propertyTitle}</strong> fue aceptada.</p><p>El propietario se va a comunicar con vos para coordinar los próximos pasos.</p>`,
    });
  },

  sendApplicationRejected(tenantEmail, tenantName, propertyTitle) {
    sendEmail({
      to: tenantEmail,
      subject: 'Tu postulación no fue seleccionada',
      html: `<p>Hola ${tenantName},</p><p>Lamentablemente tu postulación para <strong>${propertyTitle}</strong> no fue seleccionada.</p><p>No te desanimes, seguí buscando otras propiedades en <a href="${FRONTEND_URL}">AlquiListo</a>.</p>`,
    });
  },
};
