import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Calendar, MapPin, ChevronRight, Plus, 
  Clock, CheckCircle2, AlertCircle, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Package },
  requested: { label: 'Awaiting Quotes', color: 'bg-blue-100 text-blue-700', icon: Clock },
  quoted: { label: 'Quotes Ready', color: 'bg-purple-100 text-purple-700', icon: Package },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  arrived: { label: 'Mover Arrived', color: 'bg-amber-100 text-amber-700', icon: Truck },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Truck },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const bookingStatusConfig = {
  pending_deposit: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  driver_assigned: { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-700', icon: Truck },
  on_route: { label: 'On Route', color: 'bg-blue-100 text-blue-700', icon: Truck },
  arrived: { label: 'Mover Arrived', color: 'bg-amber-100 text-amber-700', icon: Truck },
  loading: { label: 'Loading', color: 'bg-amber-100 text-amber-700', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-700', icon: Truck },
  unloading: { label: 'Unloading', color: 'bg-amber-100 text-amber-700', icon: Package },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function MyMoves() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [moveRequests, setMoveRequests] = useState([]);
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
        base44.auth.redirectToLogin(createPageUrl('MyMoves'));
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      // Load bookings
      const userBookings = await base44.entities.Booking.filter(
        { customer_id: userData.id },
        '-created_date'
      );
      setBookings(userBookings);

      // Load move requests without bookings
      const userMoves = await base44.entities.MoveRequest.filter(
        { customer_id: userData.id },
        '-created_date'
      );
      setMoveRequests(userMoves.filter(m => 
        !userBookings.some(b => b.move_request_id === m.id)
      ));
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(b => 
    ['pending_payment', 'pending_deposit', 'confirmed', 'driver_assigned', 'on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(b.status)
  );
  const pastBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  );
  const drafts = moveRequests.filter(m => 
    ['draft', 'requested', 'quoted'].includes(m.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Moves</h1>
            <p className="text-gray-500">Track and manage all your moves</p>
          </div>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link to={createPageUrl('CreateMove')}>
              <Plus className="w-4 h-4 mr-2" />
              New Move
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingBookings.length > 0 && (
                <Badge className="ml-2 bg-black text-white">{upcomingBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts
              {drafts.length > 0 && (
                <Badge className="ml-2 bg-gray-200 text-gray-700">{drafts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming */}
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No upcoming moves</h3>
                  <p className="text-gray-500 mb-6">
                    Ready to plan your next move?
                  </p>
                  <Button asChild className="bg-black text-white hover:bg-gray-800">
                    <Link to={createPageUrl('CreateMove')}>
                      Plan a Move
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          {/* Past */}
          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No past moves yet</p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          {/* Drafts */}
          <TabsContent value="drafts" className="space-y-4">
            {drafts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No drafts</p>
                </CardContent>
              </Card>
            ) : (
              drafts.map(move => (
                <MoveRequestCard key={move.id} move={move} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BookingCard({ booking }) {
  const status = bookingStatusConfig[booking.status] || bookingStatusConfig.pending_deposit;
  const StatusIcon = status.icon;

  return (
    <Link to={createPageUrl('BookingDetails') + `?id=${booking.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={cn(status.color, "font-medium")}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
                <span className="text-sm text-gray-500">
                  Ref: {booking.booking_reference}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {booking.move_date 
                    ? format(new Date(booking.move_date), 'EEEE, MMMM d, yyyy')
                    : 'Date TBD'}
                </span>
                <span className="text-gray-400 capitalize">• {booking.time_window}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>Move in progress</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold">
                R{booking.total_amount?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {booking.deposit_paid ? 'Deposit paid' : 'Deposit pending'}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MoveRequestCard({ move }) {
  const status = statusConfig[move.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <Link to={createPageUrl('CreateMove') + `?draft_id=${move.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="font-medium">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{move.pickup_city || 'Pickup'}</span>
                <ChevronRight className="w-4 h-4" />
                <span>{move.dropoff_city || 'Dropoff'}</span>
              </div>

              {move.move_date && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(move.move_date), 'MMMM d, yyyy')}</span>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm">
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}