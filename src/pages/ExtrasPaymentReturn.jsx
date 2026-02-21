import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, FileText, Package } from 'lucide-react';
import { generateExtrasInvoicePDF } from '../components/ExtrasInvoicePDF.js';

export default function ExtrasPaymentReturn() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [extraRequest, setExtraRequest] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    handleReturn();
  }, []);

  const handleReturn = async () => {
    const params = new URLSearchParams(window.location.search);
    const extraId = params.get('extra_id');
    const bookingId = params.get('booking_id');

    if (!extraId) {
      navigate(createPageUrl('CustomerExtras'));
      return;
    }

    // Poll briefly for ITN to update status (PayFast ITN may arrive shortly after return)
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const [extras, bookings] = await Promise.all([
        base44.entities.ExtraRequest.filter({ id: extraId }),
        bookingId ? base44.entities.Booking.filter({ id: bookingId }) : Promise.resolve([]),
      ]);
      if (extras.length > 0) setExtraRequest(extras[0]);
      if (bookings.length > 0) setBooking(bookings[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Received!</h2>
            <p className="text-gray-600 mb-6">Confirming your order...</p>
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Please wait</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = extraRequest?.description
    ? extraRequest.description.split(', ').map(s => {
        const match = s.match(/^(\d+)x (.+)$/);
        return match ? { qty: parseInt(match[1]), name: match[2] } : { qty: 1, name: s };
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardContent className="py-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Order Confirmed!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your extra materials order has been placed successfully.
            </p>

            {/* Order summary */}
            {items.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Order Summary
                </p>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.qty}x {item.name}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-sm">
                  <span>Total Paid</span>
                  <span>R{extraRequest?.amount?.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Status: {extraRequest?.status === 'paid' ? '✅ Paid' : '⏳ Processing'}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {extraRequest && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => generateExtrasInvoicePDF(extraRequest, booking)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              )}
              {booking && (
                <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                  <Link to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
                    View My Booking
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="w-full">
                <Link to={createPageUrl('MyMoves')}>Back to My Moves</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}