import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentReturn() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    handlePaymentReturn();
  }, []);

  const handlePaymentReturn = async () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');

    if (!bookingId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      // Note: Actual payment verification happens via PayFast ITN webhook
      // This return URL just redirects the customer - it doesn't confirm payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      navigate(createPageUrl('BookingDetails') + `?id=${bookingId}`);
    } catch (e) {
      console.error('Error processing return:', e);
      navigate(createPageUrl('BookingDetails') + `?id=${bookingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. We're processing your booking...
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Redirecting to your booking</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}