import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function PayFastPayment({ booking, settings, onPaymentInitiated }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (booking && settings && formRef.current && !error) {
      // Validate settings
      if (!settings.payfast_merchant_id || !settings.payfast_merchant_key) {
        setError('PayFast credentials not configured. Please contact administrator.');
        return;
      }

      // Log payment initiation
      onPaymentInitiated?.();
      
      // Auto-submit after short delay
      setTimeout(() => {
        formRef.current?.submit();
      }, 1500);
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

  // Generate payment data
  const paymentData = {
    merchant_id,
    merchant_key,
    return_url,
    cancel_url,
    notify_url,
    
    // Customer details
    name_first: booking.customer_name || 'Customer',
    name_last: booking.customer_surname || '',
    email_address: booking.customer_email || 'customer@example.com',
    
    // Transaction details
    m_payment_id: booking.id,
    amount: booking.total_amount.toFixed(2),
    item_name: `Move Booking ${booking.booking_reference}`,
    item_description: `Moving service from ${booking.pickup_address} to ${booking.dropoff_address}`,
    
    // Custom fields
    custom_str1: booking.id,
    custom_str2: booking.booking_reference,
  };

  // Generate signature string for PayFast
  const params = Object.keys(paymentData)
    .filter(key => paymentData[key] !== '' && paymentData[key] !== null)
    .sort()
    .map(key => `${key}=${encodeURIComponent(paymentData[key].toString().trim())}`)
    .join('&');
  
  const passphrase = settings.payfast_passphrase || '';
  const signature = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase.trim())}` : params;

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
            {Object.keys(paymentData).map(key => (
              <input
                key={key}
                type="hidden"
                name={key}
                value={paymentData[key]}
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