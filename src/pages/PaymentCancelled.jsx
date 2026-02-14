import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');
    
    if (!bookingId) {
      navigate(createPageUrl('Home'));
    }
  }, []);

  const handleRetry = () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');
    
    if (bookingId) {
      navigate(createPageUrl('Payment') + `?booking_id=${bookingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="py-12 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
          <p className="text-gray-600 mb-6">
            You cancelled the payment. Your booking is still pending.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(createPageUrl('MyMoves'))}>
              View My Moves
            </Button>
            <Button onClick={handleRetry} className="bg-black text-white hover:bg-gray-800">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}