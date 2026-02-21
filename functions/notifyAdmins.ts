import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Sends a notification (and optionally email) to all admin users
// Can be called from the frontend by any authenticated user
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, type, link_page, link_id, emailSubject, emailBody } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Missing title or message' }, { status: 400 });
    }

    // Fetch all users with service role to bypass RLS
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    // Create in-app notifications for each admin
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

    // Send email to each admin if emailSubject/emailBody provided
    if (emailSubject && emailBody) {
      await Promise.all(admins.map(admin =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: emailSubject,
          body: emailBody.replace('{adminName}', admin.full_name || 'Admin'),
          from_name: 'House Movers',
        })
      ));
    }

    return Response.json({ success: true, adminCount: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});