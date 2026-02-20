import { base44 } from '@/api/base44Client';

/**
 * Send an email via the backend function
 */
export async function sendEmail({ to, subject, body, from_name }) {
  try {
    await base44.functions.invoke('sendEmailNotification', { to, subject, body, from_name });
  } catch (e) {
    console.error('Email send failed:', e);
  }
}

// ─── CUSTOMER EMAILS ────────────────────────────────────────────────

export async function emailCustomerBookingConfirmed({ customerEmail, customerName, booking }) {
  await sendEmail({
    to: customerEmail,
    subject: `✅ Booking Confirmed – #${booking.booking_reference}`,
    body: `
Hi ${customerName || 'there'},

Great news! Your booking <strong>#${booking.booking_reference}</strong> has been confirmed and payment received.

<strong>Move Date:</strong> ${booking.move_date}<br/>
<strong>Total Paid:</strong> R${booking.total_amount?.toLocaleString()}

We'll notify you once the moving company accepts your job.

Thanks for choosing House Movers!
    `.trim(),
  });
}

export async function emailCustomerBookingAccepted({ customerEmail, customerName, booking, supplierName }) {
  await sendEmail({
    to: customerEmail,
    subject: `🚛 Your Move Has Been Accepted – #${booking.booking_reference}`,
    body: `
Hi ${customerName || 'there'},

Your move has been accepted by <strong>${supplierName}</strong>!

<strong>Booking:</strong> #${booking.booking_reference}<br/>
<strong>Move Date:</strong> ${booking.move_date}

You can track your move status in the app.

House Movers Team
    `.trim(),
  });
}

export async function emailCustomerSupportTicketCreated({ customerEmail, customerName, subject: ticketSubject }) {
  await sendEmail({
    to: customerEmail,
    subject: `🎫 Support Ticket Received`,
    body: `
Hi ${customerName || 'there'},

We've received your support request: <strong>"${ticketSubject}"</strong>

Our team will get back to you as soon as possible. You can also track your ticket status in the app.

House Movers Support Team
    `.trim(),
  });
}

export async function emailCustomerBookingCompleted({ customerEmail, customerName, booking }) {
  await sendEmail({
    to: customerEmail,
    subject: `🎉 Move Completed – #${booking.booking_reference}`,
    body: `
Hi ${customerName || 'there'},

Your move has been successfully completed! We hope everything went smoothly.

Please take a moment to <strong>rate your experience</strong> – it helps other customers and supports our movers.

<a href="https://app.base44.app/BookingDetails?id=${booking.id}">Rate your move</a>

House Movers Team
    `.trim(),
  });
}

// ─── SUPPLIER EMAILS ────────────────────────────────────────────────

export async function emailSupplierNewBooking({ supplierEmail, supplierName, booking, followUpNumber = 1 }) {
  const prefix = followUpNumber > 1 ? `[Follow-up ${followUpNumber}] ` : '';
  await sendEmail({
    to: supplierEmail,
    subject: `${prefix}🔔 New Booking Assigned – #${booking.booking_reference}`,
    body: `
Hi ${supplierName || 'there'},

You have a new booking waiting for your acceptance.

<strong>Booking:</strong> #${booking.booking_reference}<br/>
<strong>Move Date:</strong> ${booking.move_date}<br/>
<strong>Time Window:</strong> ${booking.time_window}

Please log in to the app to accept or review this booking as soon as possible.

House Movers Team
    `.trim(),
  });
}

export async function emailSupplierBookingRejected({ supplierEmail, supplierName, booking }) {
  await sendEmail({
    to: supplierEmail,
    subject: `❌ Booking Cancelled – #${booking.booking_reference}`,
    body: `
Hi ${supplierName || 'there'},

The booking <strong>#${booking.booking_reference}</strong> has been cancelled.

If you have any questions, please contact our support team.

House Movers Team
    `.trim(),
  });
}

export async function emailSupplierNewReview({ supplierEmail, supplierName, booking, rating }) {
  await sendEmail({
    to: supplierEmail,
    subject: `⭐ New Review Received`,
    body: `
Hi ${supplierName || 'there'},

You've received a new <strong>${rating.overall_rating}-star</strong> review for booking #${booking.booking_reference}.

${rating.review_text ? `"${rating.review_text}"` : ''}

Keep up the great work!

House Movers Team
    `.trim(),
  });
}

export async function emailSupplierBookingCompleted({ supplierEmail, supplierName, booking }) {
  await sendEmail({
    to: supplierEmail,
    subject: `🎉 Job Completed – #${booking.booking_reference}`,
    body: `
Hi ${supplierName || 'there'},

Congratulations on successfully completing booking <strong>#${booking.booking_reference}</strong>!

Your earnings will be processed according to our payment schedule.

Keep up the excellent work!

House Movers Team
    `.trim(),
  });
}

// ─── ADMIN EMAILS ────────────────────────────────────────────────────

export async function emailAdminsNewBooking({ admins, booking }) {
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `📦 New Booking Created – #${booking.booking_reference}`,
      body: `
Hi ${admin.full_name || 'Admin'},

A new booking has been created and confirmed.

<strong>Booking:</strong> #${booking.booking_reference}<br/>
<strong>Move Date:</strong> ${booking.move_date}<br/>
<strong>Amount:</strong> R${booking.total_amount?.toLocaleString()}

<a href="https://app.base44.app/AdminBookings">View in dashboard</a>
      `.trim(),
    });
  }
}

export async function emailAdminsBookingAccepted({ admins, booking, supplierName }) {
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `✅ Booking Accepted by Supplier – #${booking.booking_reference}`,
      body: `
Hi ${admin.full_name || 'Admin'},

<strong>${supplierName}</strong> has accepted booking <strong>#${booking.booking_reference}</strong>.

<a href="https://app.base44.app/AdminBookings">View in dashboard</a>
      `.trim(),
    });
  }
}

export async function emailAdminsBookingRejected({ admins, booking, supplierName }) {
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `❌ Booking Cancelled – #${booking.booking_reference}`,
      body: `
Hi ${admin.full_name || 'Admin'},

Booking <strong>#${booking.booking_reference}</strong> has been cancelled. Supplier: ${supplierName}.

<a href="https://app.base44.app/AdminBookings">View in dashboard</a>
      `.trim(),
    });
  }
}

export async function emailAdminsNewReview({ admins, booking, supplierName, rating }) {
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `⭐ New Review Submitted – ${supplierName}`,
      body: `
Hi ${admin.full_name || 'Admin'},

A new <strong>${rating.overall_rating}-star</strong> review has been submitted for <strong>${supplierName}</strong> (booking #${booking.booking_reference}).

${rating.review_text ? `"${rating.review_text}"` : 'No written review.'}

<a href="https://app.base44.app/AdminBookings">View in dashboard</a>
      `.trim(),
    });
  }
}

export async function emailAdminsNewSupportTicket({ admins, ticket, customerName }) {
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `🎫 New Support Ticket – "${ticket.subject}"`,
      body: `
Hi ${admin.full_name || 'Admin'},

A new support ticket has been submitted by <strong>${customerName || 'a customer'}</strong>.

<strong>Subject:</strong> ${ticket.subject}<br/>
<strong>Description:</strong> ${ticket.description}

<a href="https://app.base44.app/AdminSupport">View in dashboard</a>
      `.trim(),
    });
  }
}