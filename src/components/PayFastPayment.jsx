import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import md5 from 'js-md5';

export default function PayFastPayment({ booking, settings, onPaymentInitiated }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    if (booking && settings && formRef.current && !error) {
      // Validate settings
      if (!settings.payfast_merchant_id || !settings.payfast_merchant_key) {
        setError('PayFast credentials not configured. Please contact administrator.');
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

  // Use configured PayFast credentials
  const merchant_id = settings.payfast_merchant_id;
  const merchant_key = settings.payfast_merchant_key;
  const environment = settings.payfast_environment || 'sandbox';
  const payfast_url = environment === 'live' 
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
    
  const return_url = `${window.location.origin}/payment-return?booking_id=${booking.id}`;
  const cancel_url = `${window.location.origin}/payment-cancelled?booking_id=${booking.id}`;
  const notify_url = `${window.location.origin}/api/payfast-itn`;

  // Step 1: Build form parameters (what gets submitted to PayFast)
  const formParams = {
    merchant_id,
    merchant_key,  // PayFast requires this in submission
    return_url,
    cancel_url,
    notify_url,
    name_first: booking.customer_name || 'Customer',
    name_last: booking.customer_surname || '',
    email_address: booking.customer_email || 'customer@example.com',
    m_payment_id: booking.id,
    amount: booking.total_amount.toFixed(2),
    item_name: `Move Booking ${booking.booking_reference}`,
    item_description: `Moving service from ${booking.pickup_address} to ${booking.dropoff_address}`,
    custom_str1: booking.id,
    custom_str2: booking.booking_reference,
  };

  // Step 2: Use same params for signature generation
  const signatureParams = formParams;

  // Step 3: Generate signature
  const generateSignature = () => {
    // Remove empty values
    const cleaned = {};
    Object.keys(signatureParams).forEach(key => {
      const val = signatureParams[key];
      if (val !== null && val !== undefined && val !== '') {
        cleaned[key] = String(val).trim();
      }
    });

    // Sort alphabetically
    const sorted = Object.keys(cleaned).sort();

    // Build parameter string
    let paramString = sorted
      .map(key => `${key}=${encodeURIComponent(cleaned[key])}`)
      .join('&');

    // Add passphrase if exists
    const passphrase = settings.payfast_passphrase || '';
    if (passphrase) {
      paramString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
    }

    // Generate MD5 hash
    const hash = md5(paramString);

    console.log('[PayFast] ========================================');
    console.log('[PayFast] String to hash:', paramString);
    console.log('[PayFast] Generated signature:', hash);
    console.log('[PayFast] Signature length:', hash.length);
    console.log('[PayFast] Valid format:', /^[a-f0-9]{32}$/.test(hash) ? '✓ YES' : '✗ NO');
    console.log('[PayFast] ========================================');

    return hash;
  };

  const signature = generateSignature();

  // Step 4: Final payload to PayFast (formParams + signature)
  const finalPayload = {
    ...formParams,
    signature,
  };

  // Log final payload
  console.log('[PayFast] Final payload to PayFast:', finalPayload);
  console.log('[PayFast] Signature in payload:', finalPayload.signature);
  console.log('[PayFast] Signature length check:', finalPayload.signature.length === 32 ? '✓ PASS' : '✗ FAIL');

  // Debug info
  const debugInfo = {
    signatureLength: signature.length,
    signature: signature,
    isValid: /^[a-f0-9]{32}$/.test(signature),
    hasPassphrase: !!settings.payfast_passphrase,
    merchantKeyInPayload: 'merchant_key' in finalPayload ? '✓ YES' : '✗ NO',
    passphraseInPayload: 'passphrase' in finalPayload ? '✗ YES (ERROR)' : '✓ NO (CORRECT)'
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
                    R {formParams.amount}
                  </div>
                </div>
                <div className="pt-2 border-t border-yellow-300">
                  <span className="text-gray-700 block mb-1">Payload Check:</span>
                  <div className="bg-white p-2 rounded border text-xs space-y-1">
                    <div>merchant_key in payload: {debugInfo.merchantKeyInPayload}</div>
                    <div>passphrase in payload: {debugInfo.passphraseInPayload}</div>
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
            {Object.keys(finalPayload).map(key => (
              <input
                key={key}
                type="hidden"
                name={key}
                value={finalPayload[key]}
              />
            ))}
          </form>

          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}