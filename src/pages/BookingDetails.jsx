import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Calendar, MapPin, Phone, User, Clock, Package,
  CheckCircle2, AlertCircle, CreditCard, MessageSquare, Star,
  ChevronRight, FileText, Shield, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import SupportTicketDialog from '@/components/SupportTicketDialog';
import RatingDialog from '@/components/RatingDialog';
import { generateInvoicePDF } from '@/components/InvoicePDF';
import LiveTrackingMap from '@/components/LiveTrackingMap.jsx';

const statusSteps = [
  { id: 'pending_supplier_acceptance', label: 'Quote Submitted', icon: CheckCircle2 },
  { id: 'pending_payment', label: 'Mover Accepted', icon: User },
  { id: 'confirmed', label: 'Payment Received', icon: CreditCard },
  { id: 'on_route', label: 'In Transit', icon: Truck },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export default function BookingDetails() {
  const [booking, setBooking] = useState(null);
   const [moveRequest, setMoveRequest] = useState(null);
   const [quote, setQuote] = useState(null);
   const [supplier, setSupplier] = useState(null);
   const [inventoryItems, setInventoryItems] = useState([]);
   const [loading, setLoading] = useState(true);
   const [supportDialogOpen, setSupportDialogOpen] = useState(false);
   const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
   const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const bookingId = params.get('id');

      if (!bookingId) {
        return;
      }

      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      if (bookings.length === 0) return;
      
      const bookingData = bookings[0];
      setBooking(bookingData);

      // Load related data in parallel
      const [moveRequests, quotes, suppliers, items] = await Promise.all([
        base44.entities.MoveRequest.filter({ id: bookingData.move_request_id }),
        base44.entities.Quote.filter({ id: bookingData.quote_id }),
        bookingData.supplier_id && !bookingData.supplier_id.startsWith('demo') 
          ? base44.entities.Supplier.filter({ id: bookingData.supplier_id })
          : Promise.resolve([{ company_name: 'Demo Moving Co.', rating_average: 4.8 }]),
        base44.entities.InventoryItem.filter({ move_request_id: bookingData.move_request_id }),
      ]);

      if (moveRequests.length > 0) setMoveRequest(moveRequests[0]);
      if (quotes.length > 0) setQuote(quotes[0]);
      if (suppliers.length > 0) setSupplier(suppliers[0]);
      setInventoryItems(items);

      // Check if user already rated this booking
      const user = await base44.auth.me();
      const existingRatings = await base44.entities.Rating.filter({
        booking_id: bookingData.id,
        customer_id: user.id
      });
      if (existingRatings.length > 0) {
        setHasRated(true);
      }
    } catch (e) {
      console.error('Error loading booking:', e);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    const s = booking?.status;
    if (!s || s === 'pending_supplier_acceptance') return 0;
    if (s === 'pending_payment') return 1;
    if (s === 'confirmed' || s === 'driver_assigned' || s === 'mover_accepted') return 2;
    if (s === 'on_route' || s === 'arrived' || s === 'loading' || s === 'in_transit' || s === 'unloading') return 3;
    if (s === 'completed') return 4;
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">Booking not found</p>
          <Button asChild className="mt-4">
            <Link to={createPageUrl('MyMoves')}>Back to My Moves</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to={createPageUrl('MyMoves')} className="hover:text-black">
                My Moves
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>Booking Details</span>
            </div>
            <h1 className="text-2xl font-bold">
              Booking #{booking.booking_reference}
            </h1>
          </div>
          <Badge className={cn(
            "text-sm",
            booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          )}>
            {booking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>



        {/* Progress Timeline */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isCompleted ? "bg-emerald-500 text-white" :
                        isCurrent ? "bg-black text-white ring-4 ring-gray-100" :
                        "bg-gray-100 text-gray-400"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mt-2 text-center",
                        isCompleted || isCurrent ? "text-gray-900 font-medium" : "text-gray-400"
                      )}>
                        {step.label}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-px mx-2",
                        isCompleted ? "bg-emerald-500" : "bg-gray-200"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Tracking Map - show when movers are on their way */}
        {['on_route'].includes(booking.status) && (
          <div className="mb-6">
            <LiveTrackingMap bookingId={booking.id} bookingStatus={booking.status} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Move Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Move Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {booking.move_date 
                        ? format(new Date(booking.move_date), 'EEEE, MMMM d, yyyy')
                        : 'Date TBD'}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{booking.time_window} window</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-emerald-600 text-xs font-medium">A</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pickup</p>
                      <p className="font-medium">{moveRequest?.pickup_address}</p>
                      <p className="text-sm text-gray-500">
                        {moveRequest?.pickup_city} {moveRequest?.pickup_postal_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-medium">B</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dropoff</p>
                      <p className="font-medium">{moveRequest?.dropoff_address}</p>
                      <p className="text-sm text-gray-500">
                        {moveRequest?.dropoff_city} {moveRequest?.dropoff_postal_code}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Moving Company */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Moving Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{supplier?.company_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {supplier?.rating_average > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {supplier.rating_average.toFixed(1)}
                        </span>
                      )}
                      {(() => {
                        const fleet = supplier?.fleet || [];
                        const matchedVehicle = fleet.find(v => v.vehicle_type === quote?.vehicle_type) || fleet[0];
                        const crewSize = matchedVehicle?.crew_size || quote?.crew_size;
                        const vehicleLabel = matchedVehicle
                          ? `${matchedVehicle.vehicle_type}${matchedVehicle.make ? ` ${matchedVehicle.make}` : ''}${matchedVehicle.model ? ` ${matchedVehicle.model}` : ''}`
                          : quote?.vehicle_type;
                        return (
                          <>
                            {vehicleLabel && <span>• {vehicleLabel}</span>}
                            {crewSize && <span>• {crewSize} crew members</span>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {booking.driver_name && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-500">Driver Details</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{booking.driver_name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {booking.driver_phone}
                          </div>
                        </div>
                      </div>
                      {booking.vehicle_details && (
                        <p className="text-sm text-gray-500">
                          Vehicle: {booking.vehicle_details}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Inventory Summary */}
            {inventoryItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inventory ({inventoryItems.length} items)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inventoryItems.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <span>{item.item_name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                      </div>
                    ))}
                    {inventoryItems.length > 5 && (
                      <p className="text-sm text-gray-500 pt-2">
                        + {inventoryItems.length - 5} more items
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Moving Service</span>
                    <span>R{(booking.total_amount - (booking.extras_amount || 0)).toLocaleString()}</span>
                  </div>
                  {booking.extras_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extras</span>
                      <span>R{booking.extras_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>R{booking.total_amount?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm pt-2">
                  <span className={cn("flex items-center gap-2", booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600')}>
                    {booking.payment_status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    Payment Status
                  </span>
                  <span className="font-medium">{booking.payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
                </div>

                {booking.payment_status !== 'paid' && (() => {
                  const createdAt = new Date(booking.created_date);
                  const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
                  const paymentExpired = hoursSinceCreated > 24;
                  return paymentExpired ? (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-600 text-center">
                      Payment window expired. Please contact support.
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-black text-white hover:bg-gray-800 mt-2"
                      onClick={() => window.location.href = createPageUrl('Payment') + `?booking_id=${booking.id}`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="py-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSupportDialogOpen(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateInvoicePDF(booking, moveRequest, supplier, quote)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Invoice
                </Button>
                {booking.status === 'completed' && !hasRated && (
                  <Button 
                    className="w-full justify-start bg-black text-white hover:bg-gray-800"
                    onClick={() => setRatingDialogOpen(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate Your Move
                  </Button>
                )}
                {hasRated && (
                  <Button 
                    disabled
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Already Rated
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-gray-50 border-0">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Need Help?</p>
                    <p className="text-gray-500">
                      Our support team is available 24/7 to assist with any issues.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SupportTicketDialog 
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
        bookingId={booking.id}
      />
      <RatingDialog 
         open={ratingDialogOpen}
         onOpenChange={setRatingDialogOpen}
         booking={booking}
         supplier={supplier}
         onSuccess={() => {
           setHasRated(true);
           setRatingDialogOpen(false);
         }}
       />
    </div>
  );
}