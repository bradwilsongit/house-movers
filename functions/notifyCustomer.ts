import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { customer_id, title, message, type, link_page, link_id, emailSubject, emailBody } = payload;

    if (!customer_id || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to fetch the customer (bypasses RLS)
    const users = await base44.asServiceRole.entities.User.filter({ id: customer_id });
    const customer = users[0];

    if (!customer?.email) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: customer.id,
      user_email: customer.email,
      title,
      message,
      type: type || 'system',
      is_read: false,
      link_page: link_page || null,
      link_id: link_id || null,
    });

    // Send email if subject and body provided
    if (emailSubject && emailBody) {
      const personalizedBody = emailBody.replace('{customerName}', customer.full_name || 'there');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: customer.email,
        subject: emailSubject,
        body: personalizedBody,
        from_name: 'House Movers',
      });
    }

    return Response.json({ success: true, sent_to: customer.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});