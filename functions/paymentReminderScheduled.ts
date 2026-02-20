import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Scheduled function: runs every hour to send payment reminders for pending bookings
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all bookings with pending payment
    const pendingBookings = await base44.asServiceRole.entities.Booking.filter({ payment_status: 'pending' });

    for (const booking of pendingBookings) {
      const createdAt = new Date(booking.created_date);
      const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      // Only remind within the 24hr window and at ~1h, ~6h, ~20h marks
      if (hoursElapsed > 24) continue;

      const isFirstReminder = hoursElapsed >= 1 && hoursElapsed < 2;
      const isSecondReminder = hoursElapsed >= 6 && hoursElapsed < 7;
      const isThirdReminder = hoursElapsed >= 20 && hoursElapsed < 21;

      if (!isFirstReminder && !isSecondReminder && !isThirdReminder) continue;

      // Get customer email
      const users = await base44.asServiceRole.entities.User.list();
      const customer = users.find(u => u.id === booking.customer_id);
      if (!customer?.email) continue;

      const hoursLeft = Math.round(24 - hoursElapsed);
      const subject = `⏰ Payment Reminder – Booking #${booking.booking_reference}`;
      const body = `
Hi ${customer.full_name || 'there'},

This is a reminder that your booking <strong>#${booking.booking_reference}</strong> is awaiting payment.

<strong>Amount due: R${booking.total_amount?.toLocaleString()}</strong>

You have approximately <strong>${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}</strong> remaining to complete your payment before the booking window expires.

<a href="https://app.base44.app/Payment?booking_id=${booking.id}">Click here to pay now</a>

If you have any questions, please contact our support team.

House Movers Team
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: customer.email,
        subject,
        body,
        from_name: 'House Movers',
      });
    }

    return Response.json({ success: true, processed: pendingBookings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});