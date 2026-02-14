import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function PayFastPayment({ booking, onPaymentInitiated }) {
  const formRef = useRef(null);

  useEffect(() => {
    if (booking && formRef.current) {
      // Log payment initiation
      onPaymentInitiated?.();
      
      // Auto-submit after short delay
      setTimeout(() => {
        formRef.current?.submit();
      }, 1000);
    }
  }, [booking, onPaymentInitiated]);

  if (!booking) return null;

  // PayFast sandbox credentials
  const merchant_id = '10000100'; // PayFast test merchant ID
  const merchant_key = '46f0cd694581a'; // PayFast test merchant key
  const return_url = `${window.location.origin}/booking-details?id=${booking.id}`;
  const cancel_url = `${window.location.origin}/booking-details?id=${booking.id}&payment=cancelled`;
  const notify_url = `${window.location.origin}/api/payfast-itn`; // This requires backend function

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

  // Generate signature (simplified - should be done server-side)
  const generateSignature = (data) => {
    const params = Object.keys(data)
      .filter(key => data[key] !== '' && data[key] !== null)
      .sort()
      .map(key => `${key}=${encodeURIComponent(data[key].toString().trim())}`)
      .join('&');
    return params; // In production, this should be an MD5 hash with passphrase
  };

  const signature = generateSignature(paymentData);

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
            action="https://sandbox.payfast.co.za/eng/process"
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