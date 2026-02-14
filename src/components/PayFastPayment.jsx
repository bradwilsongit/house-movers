import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import md5 from 'crypto-js/md5';

export default function PayFastPayment({ booking, settings, onPaymentInitiated }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    if (booking && settings && formRef.current && !error) {
      // Validate settings based on environment (with legacy fallback)
      const env = settings.payfast_environment || 'sandbox';
      const envMerchantId = settings[`payfast_${env}_merchant_id`] || settings.payfast_merchant_id;
      const envMerchantKey = settings[`payfast_${env}_merchant_key`] || settings.payfast_merchant_key;
      
      if (!envMerchantId || !envMerchantKey) {
        setError(`PayFast ${env} credentials not configured. Please contact administrator.`);
        return;
      }

      // Log payment initiation
      onPaymentInitiated?.();
      
      // Auto-submit after 5 seconds to allow viewing debug info
      setTimeout(() => {
        setShowDebug(false);
        formRef.current?.submit();
      }, 5000);
    }
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

  // Use configured PayFast credentials based on environment
  // Fallback to legacy field names for backwards compatibility
  const environment = settings.payfast_environment || 'sandbox';
  const merchant_id = environment === 'live' 
    ? (settings.payfast_live_merchant_id || settings.payfast_merchant_id)
    : (settings.payfast_sandbox_merchant_id || settings.payfast_merchant_id);
  const merchant_key = environment === 'live' 
    ? (settings.payfast_live_merchant_key || settings.payfast_merchant_key)
    : (settings.payfast_sandbox_merchant_key || settings.payfast_merchant_key);
  const passphrase = environment === 'live' 
    ? (settings.payfast_live_passphrase || settings.payfast_passphrase || '')
    : (settings.payfast_sandbox_passphrase || settings.payfast_passphrase || '');
  
  const payfast_url = environment === 'live' 
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
    
  const return_url = `${window.location.origin}/payment-return?booking_id=${booking.id}`;
  const cancel_url = `${window.location.origin}/payment-cancelled?booking_id=${booking.id}`;
  const notify_url = `${window.location.origin}/api/payfast-itn`;



  // Helper: PHP urlencode equivalent (spaces as "+", not "%20")
  const pfUrlEncode = (val) => {
    return encodeURIComponent(val)
      .replace(/%20/g, '+')
      .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
      .replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase());
  };

  // Helper: Build clean fields (remove empty) and generate signature
  const buildPayfastFieldsAndSignature = (data, passphrase) => {
    // 1) remove empty/null/undefined (IMPORTANT: also don't POST them)
    const clean = Object.fromEntries(
      Object.entries(data).filter(
        ([, v]) => v !== null && v !== undefined && String(v).trim() !== ''
      )
    );

    // 2) build param string (sorted keys)
    const keys = Object.keys(clean).sort();
    const pfParamString = keys
      .map((k) => `${k}=${pfUrlEncode(String(clean[k]).trim())}`)
      .join('&');

    // 3) append passphrase ONLY for hashing (not as a field)
    const finalString =
      passphrase && String(passphrase).trim() !== ''
        ? `${pfParamString}&passphrase=${pfUrlEncode(String(passphrase).trim())}`
        : pfParamString;

    // 4) md5 -> 32-char hex
    const signature = md5(finalString).toString();

    console.log('[PayFast] ========================================');
    console.log('[PayFast] Fields to hash & POST:', keys.join(', '));
    console.log('[PayFast] String to hash:', finalString);
    console.log('[PayFast] Generated signature:', signature);
    console.log('[PayFast] Signature length:', signature.length);
    console.log('[PayFast] Valid format:', /^[a-f0-9]{32}$/.test(signature) ? '✓ YES' : '✗ NO');
    console.log('[PayFast] ========================================');

    return { fields: clean, signature, finalString };
  };

  // Build payment data
  const paymentDataRaw = {
    merchant_id,
    merchant_key,
    return_url,
    cancel_url,
    notify_url,
    name_first: booking.customer_name || 'Customer',
    name_last: booking.customer_surname || '',
    email_address: booking.customer_email || 'customer@example.com',
    m_payment_id: booking.id,
    amount: Number(booking.total_amount).toFixed(2),
    item_name: `Move Booking ${booking.booking_reference}`,
    item_description: `Moving service from ${booking.pickup_address} to ${booking.dropoff_address}`,
    custom_str1: booking.id,
    custom_str2: booking.booking_reference,
  };

  // Generate signature (passphrase used ONLY for hashing, never submitted)
  const { fields: paymentData, signature } = buildPayfastFieldsAndSignature(paymentDataRaw, passphrase);

  // Log final payload
  console.log('[PayFast] ========================================');
  console.log('[PayFast] FORM VALUES (raw, NOT urlencoded):');
  console.log('[PayFast] Fields count:', Object.keys(paymentData).length);
  Object.entries(paymentData).forEach(([k, v]) => {
    console.log(`[PayFast]   ${k}: ${v}`);
  });
  console.log('[PayFast] passphrase in form data:', 'passphrase' in paymentData ? '✗ YES (ERROR!)' : '✓ NO (CORRECT)');
  console.log('[PayFast] ========================================');

  // Debug info
  const debugInfo = {
    signatureLength: signature.length,
    signature: signature,
    isValid: /^[a-f0-9]{32}$/.test(signature),
    hasPassphrase: !!passphrase,
    passphraseInPayload: 'passphrase' in paymentData ? '✗ YES (ERROR)' : '✓ NO (CORRECT)'
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            {showDebug ? 'Preparing Payment...' : 'Redirecting to PayFast...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showDebug && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4 space-y-3">
              <h4 className="font-semibold text-yellow-900">🔍 PayFast Debug Info</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Signature Length:</span>
                  <span className={`font-bold ${debugInfo.signatureLength === 32 ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.signatureLength} {debugInfo.signatureLength === 32 ? '✓' : '✗ (must be 32)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Format Valid:</span>
                  <span className={`font-bold ${debugInfo.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.isValid ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Has Passphrase:</span>
                  <span className="font-bold">{debugInfo.hasPassphrase ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="pt-2 border-t border-yellow-300">
                  <span className="text-gray-700 block mb-1">Generated Signature:</span>
                  <div className="bg-white p-2 rounded border break-all text-xs">
                    {debugInfo.signature}
                  </div>
                </div>
                <div className="pt-2 border-t border-yellow-300">
                  <span className="text-gray-700 block mb-1">Amount:</span>
                  <div className="bg-white p-2 rounded border">
                    R {paymentData.amount}
                  </div>
                </div>
                <div className="pt-2 border-t border-yellow-300">
                  <span className="text-gray-700 block mb-1">Payload Check:</span>
                  <div className="bg-white p-2 rounded border text-xs space-y-1">
                    <div>passphrase in payload: {debugInfo.passphraseInPayload}</div>
                    <div>Has passphrase for hash: {debugInfo.hasPassphrase ? '✓ YES' : '✗ NO'}</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-yellow-800 italic pt-2">
                Check browser console (F12) for full details. Auto-redirecting in 5 seconds...
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-4">
            {showDebug ? 'Validating payment details...' : 'Please wait while we redirect you to PayFast secure payment gateway.'}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">R {booking.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Booking:</span>
              <span className="font-medium">{booking.booking_reference}</span>
            </div>
          </div>

          {/* PayFast Payment Form */}
          <form
            ref={formRef}
            action={payfast_url}
            method="post"
            className="hidden"
          >
            {Object.entries(paymentData).map(([key, value]) => (
              <input
                key={key}
                type="hidden"
                name={key}
                value={value}
              />
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