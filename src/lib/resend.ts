import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
  return new Resend(process.env.RESEND_API_KEY);
}

interface FormSubmission {
  roasteryName: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  instagram: string;
  yearFounded: string;
  heardAbout: string;
  interest: string;
  notes: string;
}

export async function sendNotificationEmail(data: FormSubmission) {
  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) throw new Error('NOTIFICATION_EMAIL not configured');

  const resend = getResend();
  await resend.emails.send({
    from: 'tāst VRP <onboarding@resend.dev>',
    to,
    subject: `New VRP Application: ${data.roasteryName}`,
    html: `
      <h2>New Verified Roaster Partner Application</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;">
        <tr><td style="padding:6px 12px;font-weight:bold;">Roastery</td><td style="padding:6px 12px;">${escapeHtml(data.roasteryName)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Contact</td><td style="padding:6px 12px;">${escapeHtml(data.contactName)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;">${escapeHtml(data.email)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Phone</td><td style="padding:6px 12px;">${escapeHtml(data.phone || '—')}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Location</td><td style="padding:6px 12px;">${escapeHtml(data.location)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Website</td><td style="padding:6px 12px;">${escapeHtml(data.website || '—')}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Instagram</td><td style="padding:6px 12px;">${escapeHtml(data.instagram ? '@' + data.instagram : '—')}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Year Founded</td><td style="padding:6px 12px;">${escapeHtml(data.yearFounded || '—')}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Heard About</td><td style="padding:6px 12px;">${escapeHtml(data.heardAbout || '—')}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Interest</td><td style="padding:6px 12px;">${escapeHtml(data.interest || '—')}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Notes</td><td style="padding:6px 12px;">${escapeHtml(data.notes || '—')}</td></tr>
      </table>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
