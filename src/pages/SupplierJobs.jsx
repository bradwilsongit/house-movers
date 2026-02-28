import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Calendar, MapPin, ChevronRight, Clock,
  CheckCircle2, AlertCircle, Package, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending_supplier_acceptance: { label: 'Needs Acceptance', color: 'bg-amber-100 text-amber-700' },
  pending_payment: { label: 'Awaiting Payment', color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  mover_accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700' },
  on_route: { label: 'On Route', color: 'bg-blue-100 text-blue-700' },
  arrived: { label: 'Arrived', color: 'bg-amber-100 text-amber-700' },
  loading: { label: 'Loading', color: 'bg-amber-100 text-amber-700' },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-700' },
  unloading: { label: 'Unloading', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function SupplierJobs() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [moveRequests, setMoveRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('SupplierJobs'));
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      if (userData.supplier_id) {
        const supplierBookings = await base44.entities.Booking.filter(
          { supplier_id: userData.supplier_id },
          '-created_date'
        );
        setBookings(supplierBookings);

        // Load move requests
        const moveRequestIds = [...new Set(supplierBookings.map(b => b.move_request_id))];
        const moveRequestData = {};
        for (const id of moveRequestIds) {
          const moves = await base44.entities.MoveRequest.filter({ id });
          if (moves.length > 0) {
            moveRequestData[id] = moves[0];
          }
        }
        setMoveRequests(moveRequestData);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(b => 
    ['pending_supplier_acceptance', 'pending_payment', 'pending_deposit', 'confirmed', 'mover_accepted'].includes(b.status)
  );
  const activeBookings = bookings.filter(b => 
    ['on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(b.status)
  );
  const completedBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Jobs</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingBookings.length > 0 && (
                <Badge className="ml-2 bg-black text-white">{upcomingBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              {activeBookings.length > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white">{activeBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No upcoming jobs</p>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map(booking => (
                <JobCard 
                  key={booking.id} 
                  booking={booking} 
                  moveRequest={moveRequests[booking.move_request_id]}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No active jobs</p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map(booking => (
                <JobCard 
                  key={booking.id} 
                  booking={booking}
                  moveRequest={moveRequests[booking.move_request_id]}
                  active
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No completed jobs yet</p>
                </CardContent>
              </Card>
            ) : (
              completedBookings.map(booking => (
                <JobCard 
                  key={booking.id} 
                  booking={booking}
                  moveRequest={moveRequests[booking.move_request_id]}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function JobCard({ booking, moveRequest, active }) {
  const status = statusConfig[booking.status] || statusConfig.confirmed;
  const needsAcceptance = booking.status === 'confirmed';

  return (
    <Link to={createPageUrl('SupplierJobDetails') + `?id=${booking.id}`}>
      <Card className={cn(
        "hover:shadow-md transition-shadow",
        active && "border-2 border-blue-500"
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={status.color}>{status.label}</Badge>
                <span className="text-sm text-gray-500">
                  {booking.booking_reference}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {booking.move_date 
                    ? format(new Date(booking.move_date), 'EEE, MMM d, yyyy')
                    : 'Date TBD'}
                </span>
                <span className="text-gray-400 capitalize">• {booking.time_window}</span>
              </div>

              {moveRequest && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{moveRequest.pickup_city}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{moveRequest.dropoff_city}</span>
                </div>
              )}

              {needsAcceptance && (
                <div className="flex items-center gap-2 mt-3 text-emerald-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Ready to accept</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold">R{booking.total_amount?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                {booking.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}