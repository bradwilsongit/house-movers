import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Truck, Calendar, MapPin, Phone, User, Clock, Package,
  CheckCircle2, AlertCircle, ChevronRight, Camera,
  Play, Flag, Navigation, NavigationOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { emailSupplierBookingCompleted } from '@/components/emailUtils';

const statusConfig = {
  pending_supplier_acceptance: { label: 'Pending Your Acceptance', color: 'bg-amber-100 text-amber-700', next: 'pending_payment' },
  pending_payment: { label: 'Awaiting Customer Payment', color: 'bg-gray-100 text-gray-700', next: null },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', next: 'on_route' },
  mover_accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', next: 'on_route' },
  on_route: { label: 'In Transit', color: 'bg-blue-100 text-blue-700', next: 'arrived' },
  arrived: { label: 'Arrived', color: 'bg-amber-100 text-amber-700', next: 'completed' },
  loading: { label: 'Arrived', color: 'bg-amber-100 text-amber-700', next: 'completed' },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-700', next: 'completed' },
  unloading: { label: 'Arrived', color: 'bg-amber-100 text-amber-700', next: 'completed' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', next: null },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', next: null },
};

export default function SupplierJobDetails() {
  const [booking, setBooking] = useState(null);
  const [moveRequest, setMoveRequest] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [packagingOrder, setPackagingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const trackingIntervalRef = React.useRef(null);
  
  const [driverDialog, setDriverDialog] = useState(false);
  const [driverForm, setDriverForm] = useState({
    driver_name: '',
    driver_phone: '',
    vehicle_details: '',
  });
  const [isTracking, setIsTracking] = useState(false);



  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const bookingId = params.get('id');

      if (!bookingId) return;

      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      if (bookings.length === 0) return;

      const bookingData = bookings[0];
      setBooking(bookingData);
      setDriverForm({
        driver_name: bookingData.driver_name || '',
        driver_phone: bookingData.driver_phone || '',
        vehicle_details: bookingData.vehicle_details || '',
      });

      // Load related data
      const [moveRequests, items, packaging] = await Promise.all([
        base44.entities.MoveRequest.filter({ id: bookingData.move_request_id }),
        base44.entities.InventoryItem.filter({ move_request_id: bookingData.move_request_id }),
        base44.entities.PackagingOrder.filter({ move_request_id: bookingData.move_request_id }),
      ]);

      if (moveRequests.length > 0) setMoveRequest(moveRequests[0]);
      setInventoryItems(items);
      if (packaging.length > 0) setPackagingOrder(packaging[0]);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = (bookingId) => {
    if (!navigator.geolocation) return;
    
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await base44.functions.invoke('updateDriverLocation', {
          booking_id: bookingId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          is_active: true,
        });
      });
    };

    sendLocation(); // send immediately
    trackingIntervalRef.current = setInterval(sendLocation, 15000); // every 15 seconds
    setIsTracking(true);
  };

  const stopTracking = async (bookingId) => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
    // Mark tracking as inactive
    await base44.functions.invoke('updateDriverLocation', {
      booking_id: bookingId,
      latitude: 0,
      longitude: 0,
      is_active: false,
    }).catch(() => {});
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking(booking.id);
    } else {
      startTracking(booking.id);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setProcessing(true);
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      await base44.entities.Booking.update(booking.id, updateData);
      setBooking({ ...booking, ...updateData });

      // Start tracking when on_route (heading to pickup), stop when arrived
      if (newStatus === 'on_route') {
        startTracking(booking.id);
      } else if (newStatus === 'arrived' || newStatus === 'completed') {
        stopTracking(booking.id);
      }

      // Send email notifications on key status changes
      if (newStatus === 'mover_accepted') {
        const supplierList = await base44.entities.Supplier.filter({ id: booking.supplier_id });
        const supplierData = supplierList[0];
        // Notify customer via backend (bypasses RLS to fetch customer email)
        await base44.functions.invoke('notifyAdmins', {
          title: `Booking Accepted by Supplier – #${booking.booking_reference}`,
          message: `${supplierData?.company_name} has accepted booking #${booking.booking_reference}.`,
          type: 'booking',
          link_page: 'AdminBookings',
          link_id: booking.id,
          emailSubject: `✅ Booking Accepted by Supplier – #${booking.booking_reference}`,
          emailBody: `Hi {adminName},\n\n<strong>${supplierData?.company_name}</strong> has accepted booking <strong>#${booking.booking_reference}</strong>.\n\n<a href="https://app.base44.app/AdminBookings">View in dashboard</a>`,
        });
        // Email customer directly via notifyCustomer
        await base44.functions.invoke('notifyCustomer', {
          customer_id: booking.customer_id,
          title: 'Your Move Has Been Accepted',
          message: `Your move has been accepted by ${supplierData?.company_name}. Booking #${booking.booking_reference}`,
          type: 'booking',
          link_page: 'BookingDetails',
          link_id: booking.id,
          emailSubject: `🚛 Your Move Has Been Accepted – #${booking.booking_reference}`,
          emailBody: `Hi there,\n\nYour move has been accepted by <strong>${supplierData?.company_name}</strong>!\n\n<strong>Booking:</strong> #${booking.booking_reference}<br/><strong>Move Date:</strong> ${booking.move_date}\n\nYou can track your move status in the app.\n\nHouse Movers Team`,
        });
      }

      if (newStatus === 'completed') {
        const supplierList = await base44.entities.Supplier.filter({ id: booking.supplier_id });
        const supplierData = supplierList[0];
        if (supplierData?.contact_email) {
          emailSupplierBookingCompleted({ supplierEmail: supplierData.contact_email, supplierName: supplierData.company_name, booking });
        }
        // Email customer via backend
        await base44.functions.invoke('notifyCustomer', {
          customer_id: booking.customer_id,
          title: 'Your Move Is Complete!',
          message: `Booking #${booking.booking_reference} has been completed. Please rate your experience.`,
          type: 'booking',
          link_page: 'BookingDetails',
          link_id: booking.id,
          emailSubject: `🎉 Move Completed – #${booking.booking_reference}`,
          emailBody: `Hi there,\n\nYour move has been successfully completed! We hope everything went smoothly.\n\nPlease take a moment to <strong>rate your experience</strong>.\n\n<a href="https://app.base44.app/BookingDetails?id=${booking.id}">Rate your move</a>\n\nHouse Movers Team`,
        });
      }
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveDriverDetails = async () => {
   setProcessing(true);
   try {
     await base44.entities.Booking.update(booking.id, {
       ...driverForm,
     });
     setBooking({ ...booking, ...driverForm });
     setDriverDialog(false);
   } catch (e) {
     console.error('Error saving driver details:', e);
   } finally {
     setProcessing(false);
   }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">Job not found</p>
          <Button asChild className="mt-4">
            <Link to={createPageUrl('SupplierJobs')}>Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.confirmed;
  const canUpdateStatus = status.next && booking.payment_status === 'paid';
  const needsAcceptance = booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to={createPageUrl('SupplierJobs')} className="hover:text-black">
                Jobs
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>Job Details</span>
            </div>
            <h1 className="text-2xl font-bold">
              {booking.booking_reference}
            </h1>
          </div>
          <Badge className={status.color}>
            {status.label}
          </Badge>
        </div>

        {/* Alert for acceptance */}
        {needsAcceptance && (
          <Card className="bg-emerald-50 border-emerald-200 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">Ready to Accept</p>
                    <p className="text-sm text-emerald-700">
                      Click below to accept this job
                    </p>
                  </div>
                </div>
                <Button onClick={() => handleUpdateStatus('mover_accepted')} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                  Accept Job
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      {moveRequest?.pickup_access && (
                        <div className="text-sm text-gray-500 mt-1">
                          Floor {moveRequest.pickup_access.floor || 'Ground'} • 
                          {moveRequest.pickup_access.has_lift ? ' Has lift' : ' No lift'} •
                          {moveRequest.pickup_access.parking_available ? ' Parking' : ' No parking'}
                        </div>
                      )}
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

                {moveRequest?.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Customer Notes</p>
                      <p className="text-sm">{moveRequest.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Inventory ({inventoryItems.reduce((sum, i) => sum + i.quantity, 0)} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span>{item.item_name}</span>
                        {item.is_fragile && (
                          <Badge variant="outline" className="text-amber-600 text-xs">Fragile</Badge>
                        )}
                        {item.needs_dismantling && (
                          <Badge variant="outline" className="text-xs">Dismantle</Badge>
                        )}
                      </div>
                      <span className="text-gray-500">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Packaging Checklist */}
            {packagingOrder && packagingOrder.items?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Packaging Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-3">
                    Bring these items to the job:
                  </p>
                  <div className="space-y-2">
                    {packagingOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span>{item.name}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Driver Details - Optional */}
            {booking.status !== 'confirmed' && booking.driver_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Driver Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.driver_name}</p>
                      <p className="text-sm text-gray-500">{booking.driver_phone}</p>
                      <p className="text-sm text-gray-500">{booking.vehicle_details}</p>
                    </div>
                    <Button variant="outline" className="ml-auto" onClick={() => setDriverDialog(true)}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">R{booking.total_amount?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Payment Status
                  </span>
                  <span className="font-medium">{booking.payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canUpdateStatus && (
                  <Button 
                    className="w-full bg-black text-white hover:bg-gray-800"
                    onClick={() => handleUpdateStatus(status.next)}
                    disabled={processing}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Mark as {statusConfig[status.next]?.label}
                  </Button>
                )}

                {/* Show share location button when in transit (on_route) */}
                {booking.status === 'on_route' && (
                  <Button
                    variant={isTracking ? 'destructive' : 'outline'}
                    className="w-full"
                    onClick={handleToggleTracking}
                  >
                    {isTracking ? (
                      <><NavigationOff className="w-4 h-4 mr-2" />Stop Sharing Location</>
                    ) : (
                      <><Navigation className="w-4 h-4 mr-2" />Share My Location</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Driver Details Dialog */}
        <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
              <DialogDescription>
                Enter the driver and vehicle details for this job
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="driver_name">Driver Name</Label>
                <Input
                  id="driver_name"
                  value={driverForm.driver_name}
                  onChange={(e) => setDriverForm({ ...driverForm, driver_name: e.target.value })}
                  placeholder="John Smith"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="driver_phone">Driver Phone</Label>
                <Input
                  id="driver_phone"
                  value={driverForm.driver_phone}
                  onChange={(e) => setDriverForm({ ...driverForm, driver_phone: e.target.value })}
                  placeholder="072 123 4567"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_details">Vehicle Details</Label>
                <Input
                  id="vehicle_details"
                  value={driverForm.vehicle_details}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicle_details: e.target.value })}
                  placeholder="White 4-ton Truck, ABC 123 GP"
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDriverDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveDriverDetails}
                disabled={processing || !driverForm.driver_name || !driverForm.driver_phone}
                className="bg-black text-white hover:bg-gray-800"
              >
                {processing ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
}