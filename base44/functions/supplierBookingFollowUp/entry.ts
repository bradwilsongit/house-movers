import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Scheduled: runs hourly - sends follow-up emails to suppliers who haven't accepted bookings
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find confirmed bookings (paid but not yet accepted by supplier)
    const confirmedBookings = await base44.asServiceRole.entities.Booking.filter({ status: 'confirmed', payment_status: 'paid' });

    for (const booking of confirmedBookings) {
      const createdAt = new Date(booking.created_date);
      const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      // Only follow up within 24 hours
      if (hoursElapsed > 24) continue;

      // Follow-up at ~2h, ~8h, ~20h after booking confirmed
      const isFollowUp1 = hoursElapsed >= 2 && hoursElapsed < 3;
      const isFollowUp2 = hoursElapsed >= 8 && hoursElapsed < 9;
      const isFollowUp3 = hoursElapsed >= 20 && hoursElapsed < 21;

      if (!isFollowUp1 && !isFollowUp2 && !isFollowUp3) continue;

      const followUpNumber = isFollowUp1 ? 2 : isFollowUp2 ? 3 : 4;

      // Get supplier
      const suppliers = await base44.asServiceRole.entities.Supplier.filter({ id: booking.supplier_id });
      const supplier = suppliers[0];
      if (!supplier?.contact_email) continue;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: supplier.contact_email,
        subject: `[Follow-up ${followUpNumber - 1}] 🔔 Action Required – Booking #${booking.booking_reference}`,
        body: `
Hi ${supplier.company_name || 'there'},

This is a follow-up reminder. You have a confirmed booking that is still awaiting your acceptance.

<strong>Booking:</strong> #${booking.booking_reference}<br/>
<strong>Move Date:</strong> ${booking.move_date}<br/>
<strong>Time Window:</strong> ${booking.time_window}

Please log in to the app and accept this booking as soon as possible. Failure to respond within 24 hours may result in the booking being reassigned.

House Movers Team
        `.trim(),
        from_name: 'House Movers',
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});