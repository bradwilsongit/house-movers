import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import CryptoJS from 'npm:crypto-js@4.2.0';

Deno.serve(async (req) => {
  try {
    // ITN is a POST from PayFast servers - no user auth needed
    // We use service role to update entities
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const data = Object.fromEntries(params.entries());

    console.log('PayFast ITN received:', JSON.stringify(data));

    // Get app settings to retrieve passphrase + environment
    const settings = await base44.asServiceRole.entities.AppSettings.list();
    const appSettings = settings[0] || {};

    const environment = appSettings.payfast_environment || 'sandbox';
    const passphrase = environment === 'live'
      ? appSettings.payfast_live_passphrase
      : appSettings.payfast_sandbox_passphrase;

    // --- 1. Validate signature ---
    const receivedSignature = data.signature;
    delete data.signature;

    // Build query string without signature, sorted by key order as received
    const paramsCopy = { ...data };
    let queryString = Object.keys(paramsCopy)
      .map(k => `${k}=${encodeURIComponent(paramsCopy[k]).replace(/%20/g, '+')}`)
      .join('&');

    if (passphrase) {
      queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
    }

    const computedSignature = CryptoJS.MD5(queryString).toString();

    if (computedSignature !== receivedSignature) {
      console.error('Signature mismatch', { computed: computedSignature, received: receivedSignature });
      return new Response('Signature validation failed', { status: 400 });
    }

    // --- 2. Check payment status ---
    if (data.payment_status !== 'COMPLETE') {
      console.log('Payment not complete, status:', data.payment_status);
      return new Response('OK', { status: 200 });
    }

    // --- 3. Find booking from m_payment_id ---
    // m_payment_id is set to booking_id in the PayFast form
    const bookingId = data.m_payment_id;
    if (!bookingId) {
      console.error('No booking ID in ITN');
      return new Response('No booking ID', { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      console.error('Booking not found:', bookingId);
      return new Response('Booking not found', { status: 404 });
    }

    // --- 4. Update booking payment status ---
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: 'paid',
      status: booking.status === 'pending_payment' ? 'confirmed' : booking.status,
      payfast_payment_id: data.pf_payment_id,
      paid_at: new Date().toISOString(),
    });

    // --- 5. Log the payment ---
    await base44.asServiceRole.entities.PaymentLog.create({
      booking_id: bookingId,
      payfast_reference: data.m_payment_id,
      payfast_payment_id: data.pf_payment_id,
      amount: parseFloat(data.amount_gross || 0),
      status: 'completed',
      itn_payload: JSON.stringify(data),
      itn_timestamp: new Date().toISOString(),
      signature_valid: true,
    });

    console.log('Booking confirmed via ITN:', bookingId);
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('ITN error:', error.message);
    return new Response('Internal error', { status: 500 });
  }
});