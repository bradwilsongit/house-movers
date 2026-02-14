import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import md5 from 'crypto-js/md5';

export default function PayFastPayment({ booking, settings, onPaymentInitiated }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);

  // PHP-style urlencode (spaces -> +)
  const phpUrlencode = (val) =>
    encodeURIComponent(String(val))
      .replace(/%20/g, '+')
      .replace(/~/g, '%7E');

  const buildPayfastSignature = (fieldsToPost, passphrase) => {
    // 1) remove empty + NEVER include signature
    const clean = Object.fromEntries(
      Object.entries(fieldsToPost).filter(([k, v]) => {
        if (k === 'signature') return false;
        if (v === null || v === undefined) return false;
        if (String(v).trim() === '') return false;
        return true;
      })
    );

    // 2) IMPORTANT: add passphrase BEFORE sorting (hashing only; not posted)
    const toHash =
      passphrase && String(passphrase).trim() !== ''
        ? { ...clean, passphrase: String(passphrase).trim() }
        : { ...clean };

    // 3) sort keys alphabetically
    const keys = Object.keys(toHash).sort();

    // 4) build param string with PHP-style urlencode
    const paramString = keys
      .map((k) => `${k}=${phpUrlencode(String(toHash[k]).trim())}`)
      .join('&');

    // 5) md5 -> 32-char hex
    const signature = md5(paramString).toString();

    return { cleanFieldsToPost: clean, signature, paramString };
  };

  useEffect(() => {
    if (!booking || !settings || !formRef.current || error) return;

    const env = settings.payfast_environment === 'live' ? 'live' : 'sandbox';

    const merchant_id =
      env === 'live' ? settings.payfast_live_merchant_id : settings.payfast_sandbox_merchant_id;
    const merchant_key =
      env === 'live' ? settings.payfast_live_merchant_key : settings.payfast_sandbox_merchant_key;
    const passphrase =
      env === 'live'
        ? (settings.payfast_live_passphrase || '')
        : (settings.payfast_sandbox_passphrase || '');

    if (!merchant_id || !merchant_key) {
      setError(`PayFast ${env} credentials not configured. Please contact administrator.`);
      return;
    }

    onPaymentInitiated?.();

    // Auto-submit
    setTimeout(() => {
      formRef.current?.submit();
    }, 800);
  }, [booking, settings, onPaymentInitiated, error]);

  if (!booking) return null;

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600">PayFast configuration not loaded</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const env = settings.payfast_environment === 'live' ? 'live' : 'sandbox';

  const merchant_id =
    env === 'live' ? settings.payfast_live_merchant_id : settings.payfast_sandbox_merchant_id;
  const merchant_key =
    env === 'live' ? settings.payfast_live_merchant_key : settings.payfast_sandbox_merchant_key;
  const passphrase =
    env === 'live'
      ? (settings.payfast_live_passphrase || '')
      : (settings.payfast_sandbox_passphrase || '');

  const payfast_url =
    env === 'live' ? 'https://www.payfast.co.za/eng/process' : 'https://sandbox.payfast.co.za/eng/process';

  const return_url = `${window.location.origin}/payment-return?booking_id=${booking.id}`;
  const cancel_url = `${window.location.origin}/payment-cancelled?booking_id=${booking.id}`;
  const notify_url = `${window.location.origin}/api/payfast-itn`;

  const fieldsToPost = {
    merchant_id,
    merchant_key,
    return_url,
    cancel_url,
    notify_url,

    name_first: booking.customer_name || 'Customer',
    name_last: booking.customer_surname || '', // will be dropped if empty
    email_address: booking.customer_email || 'customer@example.com',

    m_payment_id: booking.id,
    amount: Number(booking.total_amount).toFixed(2),

    item_name: `Move Booking ${booking.booking_reference}`,
    item_description: `Moving service from ${booking.pickup_address} to ${booking.dropoff_address}`,

    custom_str1: booking.id,
    custom_str2: booking.booking_reference,
  };

  const { cleanFieldsToPost, signature, paramString } = buildPayfastSignature(fieldsToPost, passphrase);

  // Optional: keep these logs while testing
  console.log('[PayFast] ENV:', env);
  console.log('[PayFast] POST fields:', Object.keys(cleanFieldsToPost).sort());
  console.log('[PayFast] Hash string:', paramString);
  console.log('[PayFast] Signature:', signature);
  console.log('[PayFast] passphrase posted?', 'passphrase' in cleanFieldsToPost ? 'YES (BUG)' : 'NO (OK)');

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Redirecting to PayFast...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Please wait while we redirect you to PayFast secure payment gateway.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">R {Number(booking.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Booking:</span>
              <span className="font-medium">{booking.booking_reference}</span>
            </div>
          </div>

          <form ref={formRef} action={payfast_url} method="post" className="hidden">
            {Object.entries(cleanFieldsToPost).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <input type="hidden" name="signature" value={signature} />
          </form>

          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
