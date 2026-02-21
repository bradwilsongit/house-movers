import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Package, CheckCircle2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminExtras() {
  const [extraRequests, setExtraRequests] = useState([]);
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [extras, bookingsData] = await Promise.all([
        base44.entities.ExtraRequest.list('-created_date', 200),
        base44.entities.Booking.list(),
      ]);

      // Only show paid extras
      setExtraRequests(extras.filter(e => e.status === 'paid'));

      const bookingMap = {};
      bookingsData.forEach(b => { bookingMap[b.id] = b; });
      setBookings(bookingMap);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Customer Extras</h1>
          <Badge className="bg-emerald-100 text-emerald-700 text-sm px-3 py-1">
            {extraRequests.length} paid order{extraRequests.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {extraRequests.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No paid extras yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {extraRequests.map(extra => {
              const booking = bookings[extra.booking_id];
              return (
                <Card key={extra.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        </div>
                        <p className="font-medium text-lg mb-3">{extra.description}</p>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Booking</p>
                            <p className="font-medium">{booking?.booking_reference || extra.booking_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Move Date</p>
                            <p className="font-medium">{booking?.move_date ? format(new Date(booking.move_date), 'MMM d, yyyy') : '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ordered</p>
                            <p className="font-medium">{format(new Date(extra.created_date), 'MMM d, yyyy HH:mm')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="flex items-center gap-1 justify-end">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <span className="text-2xl font-bold">R{extra.amount?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}