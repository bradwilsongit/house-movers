import { base44 } from '@/api/base44Client';

// ─── HTML EMAIL TEMPLATE ─────────────────────────────────────────────

function emailTemplate({ preheader = '', content, ctaText = '', ctaUrl = '' }) {
  const cta = ctaText && ctaUrl
    ? `<tr><td align="center" style="padding: 8px 0 24px;"><a href="${ctaUrl}" style="display:inline-block;background:#000000;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${ctaText}</a></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>House Movers</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background:#000000;border-radius:12px 12px 0 0;padding:28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size:22px;">🚛</span>
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;margin-left:8px;vertical-align:middle;">House Movers</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${content}
                ${cta}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">© 2026 House Movers. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">You received this email because you have an account with House Movers.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(html) {
  return `<tr><td style="padding:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${html}</td></tr>`;
}

function greeting(name) {
  return `<tr><td style="padding:0 0 20px;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">Hi ${name || 'there'} 👋</td></tr>`;
}

function divider() {
  return `<tr><td style="padding:8px 0 24px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/></td></tr>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:0 0 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:8px;padding:12px 16px;">
        <tr>
          <td style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${label}</td>
        </tr>
        <tr>
          <td style="font-size:15px;font-weight:600;color:#111827;padding-top:2px;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── SEND HELPER ─────────────────────────────────────────────────────

export async function sendEmail({ to, subject, body, from_name }) {
  try {
    await base44.integrations.Core.SendEmail({ to, subject, body, from_name: from_name || 'House Movers' });
  } catch (e) {
    console.error('Email send failed:', e);
  }
}

// ─── CUSTOMER EMAILS ──────────────────────────────────────────────────

export async function emailCustomerQuoteAccepted({ customerEmail, customerName, booking }) {
  const body = emailTemplate({
    preheader: `Your quote for booking #${booking.booking_reference} has been submitted!`,
    content: `
      ${greeting(customerName)}
      ${row('Your quote has been <strong>submitted to the moving company</strong>. They will review and confirm availability shortly — you\'ll receive an email and notification once they accept, with a link to pay.')}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${infoRow('Move Date', booking.move_date)}
      ${infoRow('Total (on acceptance)', `R${booking.total_amount?.toLocaleString()}`)}
      ${divider()}
      ${row('No payment is required until the mover accepts your job.')}
    `,
    ctaText: 'View My Booking',
    ctaUrl: `https://app.base44.app/BookingDetails?id=${booking.id}`,
  });
  await sendEmail({ to: customerEmail, subject: `📋 Quote Submitted – #${booking.booking_reference}`, body });
}

export async function emailCustomerBookingConfirmed({ customerEmail, customerName, booking }) {
  const body = emailTemplate({
    preheader: `Your booking #${booking.booking_reference} is confirmed!`,
    content: `
      ${greeting(customerName)}
      ${row('Great news! Your booking has been <strong>confirmed</strong> and payment received. Your movers will be in touch soon.')}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${infoRow('Move Date', booking.move_date)}
      ${infoRow('Total Paid', `R${booking.total_amount?.toLocaleString()}`)}
      ${divider()}
      ${row("We'll notify you once the moving company formally accepts your job.")}
    `,
    ctaText: 'View My Booking',
    ctaUrl: `https://app.base44.app/BookingDetails?id=${booking.id}`,
  });
  await sendEmail({ to: customerEmail, subject: `✅ Booking Confirmed – #${booking.booking_reference}`, body });
}

export async function emailCustomerBookingAccepted({ customerEmail, customerName, booking, supplierName }) {
  const body = emailTemplate({
    preheader: `${supplierName} has accepted your move!`,
    content: `
      ${greeting(customerName)}
      ${row(`Your move has been <strong>accepted</strong> by <strong>${supplierName}</strong>! They'll be there on your move date.`)}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${infoRow('Move Date', booking.move_date)}
      ${infoRow('Moving Company', supplierName)}
      ${divider()}
      ${row('You can track your move status in the app at any time.')}
    `,
    ctaText: 'Track My Move',
    ctaUrl: `https://app.base44.app/BookingDetails?id=${booking.id}`,
  });
  await sendEmail({ to: customerEmail, subject: `🚛 Your Move Has Been Accepted – #${booking.booking_reference}`, body });
}

export async function emailCustomerBookingCompleted({ customerEmail, customerName, booking }) {
  const body = emailTemplate({
    preheader: 'Your move is complete – please leave a review!',
    content: `
      ${greeting(customerName)}
      ${row('Your move has been <strong>successfully completed</strong>! We hope everything went smoothly.')}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${divider()}
      ${row('Please take a moment to rate your experience – it helps other customers and supports our movers.')}
    `,
    ctaText: 'Rate My Move',
    ctaUrl: `https://app.base44.app/BookingDetails?id=${booking.id}`,
  });
  await sendEmail({ to: customerEmail, subject: `🎉 Move Completed – #${booking.booking_reference}`, body });
}

export async function emailCustomerSupportTicketCreated({ customerEmail, customerName, subject: ticketSubject }) {
  const body = emailTemplate({
    preheader: 'We received your support request.',
    content: `
      ${greeting(customerName)}
      ${row('We\'ve received your support request and our team will get back to you as soon as possible.')}
      ${divider()}
      ${infoRow('Subject', ticketSubject)}
      ${infoRow('Status', 'Open – Under Review')}
      ${divider()}
      ${row('You can track your ticket status in the app.')}
    `,
    ctaText: 'View My Tickets',
    ctaUrl: 'https://app.base44.app/Support',
  });
  await sendEmail({ to: customerEmail, subject: `🎫 Support Ticket Received`, body });
}

// ─── SUPPLIER EMAILS ─────────────────────────────────────────────────

export async function emailSupplierNewBooking({ supplierEmail, supplierName, booking, followUpNumber = 1 }) {
  const prefix = followUpNumber > 1 ? `[Follow-up ${followUpNumber}] ` : '';
  const body = emailTemplate({
    preheader: `New booking #${booking.booking_reference} needs your acceptance.`,
    content: `
      ${greeting(supplierName)}
      ${row('You have a <strong>new booking</strong> waiting for your acceptance. Please log in and accept as soon as possible.')}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${infoRow('Move Date', booking.move_date)}
      ${infoRow('Time Window', booking.time_window ? booking.time_window.charAt(0).toUpperCase() + booking.time_window.slice(1) : '—')}
      ${divider()}
      ${row('Please accept or review this booking promptly to avoid it being reassigned.')}
    `,
    ctaText: 'View Job',
    ctaUrl: `https://app.base44.app/SupplierJobs`,
  });
  await sendEmail({ to: supplierEmail, subject: `${prefix}🔔 New Booking Assigned – #${booking.booking_reference}`, body });
}

export async function emailSupplierBookingRejected({ supplierEmail, supplierName, booking }) {
  const body = emailTemplate({
    preheader: `Booking #${booking.booking_reference} has been cancelled.`,
    content: `
      ${greeting(supplierName)}
      ${row(`The booking <strong>#${booking.booking_reference}</strong> has been cancelled.`)}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${divider()}
      ${row('If you have any questions, please contact our support team.')}
    `,
  });
  await sendEmail({ to: supplierEmail, subject: `❌ Booking Cancelled – #${booking.booking_reference}`, body });
}

export async function emailSupplierNewReview({ supplierEmail, supplierName, booking, rating }) {
  const stars = '⭐'.repeat(rating.overall_rating);
  const body = emailTemplate({
    preheader: `You received a ${rating.overall_rating}-star review!`,
    content: `
      ${greeting(supplierName)}
      ${row(`You've received a new review for booking <strong>#${booking.booking_reference}</strong>.`)}
      ${divider()}
      ${infoRow('Rating', `${stars} (${rating.overall_rating}/5)`)}
      ${rating.review_text ? infoRow('Review', `"${rating.review_text}"`) : ''}
      ${divider()}
      ${row('Keep up the great work!')}
    `,
    ctaText: 'View My Jobs',
    ctaUrl: 'https://app.base44.app/SupplierJobs',
  });
  await sendEmail({ to: supplierEmail, subject: `⭐ New Review Received`, body });
}

export async function emailSupplierBookingCompleted({ supplierEmail, supplierName, booking }) {
  const body = emailTemplate({
    preheader: `Job #${booking.booking_reference} marked complete.`,
    content: `
      ${greeting(supplierName)}
      ${row(`Congratulations on successfully completing booking <strong>#${booking.booking_reference}</strong>!`)}
      ${divider()}
      ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
      ${divider()}
      ${row('Your earnings will be processed according to our payment schedule. Keep up the excellent work!')}
    `,
    ctaText: 'View My Jobs',
    ctaUrl: 'https://app.base44.app/SupplierJobs',
  });
  await sendEmail({ to: supplierEmail, subject: `🎉 Job Completed – #${booking.booking_reference}`, body });
}

// ─── ADMIN EMAILS ────────────────────────────────────────────────────
// Note: Most admin emails now go via the notifyAdmins backend function.
// These helpers remain for any direct admin email calls.

export async function emailAdminsNewBooking({ admins, booking }) {
  for (const admin of admins) {
    const body = emailTemplate({
      preheader: `New booking #${booking.booking_reference} created.`,
      content: `
        ${greeting(admin.full_name || 'Admin')}
        ${row('A new booking has been created and confirmed.')}
        ${divider()}
        ${infoRow('Booking Reference', `#${booking.booking_reference}`)}
        ${infoRow('Move Date', booking.move_date)}
        ${infoRow('Amount', `R${booking.total_amount?.toLocaleString()}`)}
        ${divider()}
      `,
      ctaText: 'View in Dashboard',
      ctaUrl: 'https://app.base44.app/AdminBookings',
    });
    await sendEmail({ to: admin.email, subject: `📦 New Booking Created – #${booking.booking_reference}`, body });
  }
}

export async function emailAdminsNewSupportTicket({ admins, ticket, customerName }) {
  for (const admin of admins) {
    const body = emailTemplate({
      preheader: `New support ticket from ${customerName}.`,
      content: `
        ${greeting(admin.full_name || 'Admin')}
        ${row(`A new support ticket has been submitted by <strong>${customerName || 'a customer'}</strong>.`)}
        ${divider()}
        ${infoRow('Subject', ticket.subject)}
        ${infoRow('Description', ticket.description)}
        ${divider()}
      `,
      ctaText: 'View in Dashboard',
      ctaUrl: 'https://app.base44.app/AdminSupport',
    });
    await sendEmail({ to: admin.email, subject: `🎫 New Support Ticket – "${ticket.subject}"`, body });
  }
}