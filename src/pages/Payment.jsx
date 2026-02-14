import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import PayFastPayment from '@/components/PayFastPayment';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Payment() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooking();
    checkPaymentStatus();
  }, []);

  const loadBooking = async () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled. Please try again.');
    }

    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    try {
      // Load PayFast settings first
      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length === 0 || !settingsData[0].payfast_merchant_id) {
        setError('PayFast payment is not configured. Please contact administrator.');
        setLoading(false);
        return;
      }
      setSettings(settingsData[0]);

      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      if (bookings.length === 0) {
        setError('Booking not found');
        return;
      }

      const bookingData = bookings[0];
      
      // Validate booking has required data
      if (!bookingData.total_amount || bookingData.total_amount <= 0) {
        setError('Invalid booking amount. Please contact support.');
        return;
      }
      
      // Get customer details
      const user = await base44.auth.me();
      
      // Get move request for addresses
      const moveRequests = await base44.entities.MoveRequest.filter({ 
        id: bookingData.move_request_id 
      });
      const moveRequest = moveRequests[0];

      setBooking({
        ...bookingData,
        customer_name: user.full_name?.split(' ')[0] || 'Customer',
        customer_surname: user.full_name?.split(' ').slice(1).join(' ') || '',
        customer_email: user.email,
        pickup_address: moveRequest?.pickup_address,
        dropoff_address: moveRequest?.dropoff_address,
      });
    } catch (e) {
      console.error('Error loading booking:', e);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = () => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    
    if (paymentId) {
      // Payment completed - PayFast redirected back
      handlePaymentReturn(paymentId);
    }
  };

  const handlePaymentReturn = async (paymentId) => {
    // Note: This should ideally be handled by ITN webhook
    // For now, mark as processing and redirect
    const bookingId = new URLSearchParams(window.location.search).get('booking_id');
    
    try {
      await base44.entities.Booking.update(bookingId, {
        payfast_payment_id: paymentId,
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      });

      navigate(createPageUrl('BookingDetails') + `?id=${bookingId}`);
    } catch (e) {
      console.error('Error updating booking:', e);
    }
  };

  const handlePaymentInitiated = async () => {
    // Log that payment was initiated
    try {
      await base44.entities.PaymentLog.create({
        booking_id: booking.id,
        amount: booking.total_amount,
        status: 'initiated',
      });
    } catch (e) {
      console.error('Error logging payment:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading payment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-gray-500">
            You will be redirected to PayFast secure payment gateway
          </p>
        </div>

        <PayFastPayment 
          booking={booking}
          settings={settings}
          onPaymentInitiated={handlePaymentInitiated}
        />

        <Alert className="mt-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>Testing in Sandbox Mode</strong> - Use PayFast test cards for payment.
            In production, real payments will be processed.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}