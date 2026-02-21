import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function emailTemplate({ preheader = '', content, ctaText = '', ctaUrl = '' }) {
  const cta = ctaText && ctaUrl
    ? `<tr><td align="center" style="padding: 8px 0 24px;"><a href="${ctaUrl}" style="display:inline-block;background:#000000;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${ctaText}</a></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>House Movers</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td align="center" style="background:#000000;border-radius:12px 12px 0 0;padding:28px 40px;">
          <span style="font-size:22px;">🚛</span>
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;margin-left:8px;vertical-align:middle;">House Movers</span>
        </td></tr>
        <tr><td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${content}
            ${cta}
          </table>
        </td></tr>
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">© 2026 House Movers. All rights reserved.</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">Admin notification – House Movers Dashboard</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(html) {
  return `<tr><td style="padding:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${html}</td></tr>`;
}
function greeting(name) {
  return `<tr><td style="padding:0 0 20px;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">Hi ${name} 👋</td></tr>`;
}
function divider() {
  return `<tr><td style="padding:8px 0 24px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>`;
}
function infoBlock(label, value) {
  return `<tr><td style="padding:0 0 12px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:8px;padding:12px 16px;">
      <tr><td style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${label}</td></tr>
      <tr><td style="font-size:15px;font-weight:600;color:#111827;padding-top:2px;">${value}</td></tr>
    </table>
  </td></tr>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { title, message, type, link_page, link_id, emailSubject, emailBody, ctaText, ctaUrl } = payload;

    if (!title || !message) {
      return Response.json({ error: 'Missing title or message' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    // Create in-app notifications
    await Promise.all(admins.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        title,
        message,
        type: type || 'system',
        is_read: false,
        link_page: link_page || null,
        link_id: link_id || null,
      })
    ));

    // Send branded HTML emails
    if (emailSubject && emailBody) {
      await Promise.all(admins.map(admin => {
        const adminName = admin.full_name || 'Admin';
        const htmlBody = emailTemplate({
          preheader: title,
          content: `
            ${greeting(adminName)}
            ${row(emailBody.replace('{adminName}', adminName))}
            ${divider()}
          `,
          ctaText: ctaText || (link_page ? 'View in Dashboard' : ''),
          ctaUrl: ctaUrl || (link_page ? `https://app.base44.app/${link_page}` : ''),
        });
        return base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: emailSubject,
          body: htmlBody,
          from_name: 'House Movers',
        });
      }));
    }

    return Response.json({ success: true, adminCount: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});