import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MoveStepIndicator from '@/components/move/MoveStepIndicator';
import MoveDetailsForm from '@/components/move/MoveDetailsForm';
import InventoryWizard from '@/components/move/InventoryWizard';
import PackagingSelector from '@/components/move/PackagingSelector';
import QuoteComparison from '@/components/move/QuoteComparison';
import BookingConfirmation from '@/components/move/BookingConfirmation';

const STEPS = [
  { id: 'details', title: 'Move Details', description: 'Pickup & dropoff' },
  { id: 'inventory', title: 'Inventory', description: 'List your items' },
  { id: 'packaging', title: 'Packaging', description: 'Materials & services' },
  { id: 'quotes', title: 'Quotes', description: 'Compare prices' },
  { id: 'confirm', title: 'Confirm', description: 'Book & pay' },
];

export default function CreateMove() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Form data
  const [moveDetails, setMoveDetails] = useState({
    move_type: '',
    pickup_address: '',
    pickup_city: '',
    pickup_postal_code: '',
    dropoff_address: '',
    dropoff_city: '',
    dropoff_postal_code: '',
    move_date: '',
    time_window: 'morning',
    pickup_access: {},
    dropoff_access: {},
    special_requirements: {},
    notes: '',
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [packagingOrder, setPackagingOrder] = useState({ items: [], total_amount: 0 });
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [moveRequestId, setMoveRequestId] = useState(null);
  const [commissionRate, setCommissionRate] = useState(10);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedQuoteId && quotes.length > 0) {
      const quote = quotes.find(q => q.id === selectedQuoteId);
      setSelectedQuote(quote);
      if (quote?.supplier_id) {
        loadSupplier(quote.supplier_id);
      }
    }
  }, [selectedQuoteId, quotes]);

  const checkAuth = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl('CreateMove'));
      return;
    }
    const userData = await base44.auth.me();
    setUser(userData);
    
    // Load commission rate from settings
    try {
      const settings = await base44.entities.AppSettings.list();
      if (settings.length > 0) {
        setCommissionRate(settings[0].commission_rate || 10);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const loadSupplier = async (supplierId) => {
    try {
      const suppliers = await base44.entities.Supplier.filter({ id: supplierId });
      if (suppliers.length > 0) {
        setSupplier(suppliers[0]);
      }
    } catch (e) {
      console.error('Error loading supplier:', e);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDetailsNext = async () => {
    // Save move request
    setLoading(true);
    try {
      const moveRequest = await base44.entities.MoveRequest.create({
        ...moveDetails,
        customer_id: user?.id,
        status: 'draft',
      });
      setMoveRequestId(moveRequest.id);
      nextStep();
    } catch (e) {
      console.error('Error creating move request:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryNext = async () => {
    // Save inventory items
    setLoading(true);
    try {
      for (const item of inventoryItems) {
        await base44.entities.InventoryItem.create({
          ...item,
          move_request_id: moveRequestId,
        });
      }

      // Calculate volume and update move request
      const totalVolume = inventoryItems.reduce((sum, item) => 
        sum + (item.estimated_volume_m3 || 0.5) * item.quantity, 0
      );
      await base44.entities.MoveRequest.update(moveRequestId, {
        estimated_volume_m3: totalVolume,
        status: 'requested',
      });

      // Generate demo quotes
      await generateDemoQuotes();
      nextStep();
    } catch (e) {
      console.error('Error saving inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateDemoQuotes = async () => {
    // Get approved suppliers
    try {
      const suppliers = await base44.entities.Supplier.filter({ status: 'approved' });
      
      if (suppliers.length === 0) {
        // Create demo quotes
        const basePrice = Math.floor(Math.random() * 3000) + 3000;
        const demoQuotes = [
          {
            move_request_id: moveRequestId,
            supplier_id: 'demo-1',
            total_price: basePrice,
            vehicle_type: '4-ton Truck',
            crew_size: 3,
            estimated_duration_hours: 5,
            included_services: ['Loading', 'Unloading', 'Basic Insurance'],
            status: 'submitted',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          {
            move_request_id: moveRequestId,
            supplier_id: 'demo-2',
            total_price: basePrice + 500,
            vehicle_type: '6-ton Truck',
            crew_size: 4,
            estimated_duration_hours: 4,
            included_services: ['Loading', 'Unloading', 'Premium Insurance', 'Dismantling'],
            status: 'submitted',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          {
            move_request_id: moveRequestId,
            supplier_id: 'demo-3',
            total_price: basePrice - 300,
            vehicle_type: '3-ton Truck',
            crew_size: 2,
            estimated_duration_hours: 6,
            included_services: ['Loading', 'Unloading', 'Basic Insurance'],
            notes: 'Budget-friendly option with experienced crew',
            status: 'submitted',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        ];

        const createdQuotes = [];
        for (const quote of demoQuotes) {
          const created = await base44.entities.Quote.create(quote);
          createdQuotes.push(created);
        }
        setQuotes(createdQuotes);
      } else {
        // Use real suppliers
        const generatedQuotes = [];
        for (const supplier of suppliers.slice(0, 5)) {
          const basePrice = Math.floor(Math.random() * 2000) + 3000;
          const quote = await base44.entities.Quote.create({
            move_request_id: moveRequestId,
            supplier_id: supplier.id,
            total_price: basePrice,
            vehicle_type: '4-ton Truck',
            crew_size: 3,
            estimated_duration_hours: 5,
            included_services: ['Loading', 'Unloading', 'Basic Insurance'],
            status: 'submitted',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          generatedQuotes.push(quote);
        }
        setQuotes(generatedQuotes);
      }
    } catch (e) {
      console.error('Error generating quotes:', e);
    }
  };

  const handlePackagingNext = async () => {
    // Save packaging order
    setLoading(true);
    try {
      await base44.entities.PackagingOrder.create({
        move_request_id: moveRequestId,
        ...packagingOrder,
      });
      nextStep();
    } catch (e) {
      console.error('Error saving packaging order:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelect = (quoteId) => {
    setSelectedQuoteId(quoteId);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Calculate pricing with commission
      const distanceKm = moveDetails.distance_km || 0;
      const supplierKmRate = supplier?.pricing?.rate_per_km || 15;
      const supplierBasePrice = distanceKm * supplierKmRate;
      const commissionAmount = (supplierBasePrice * commissionRate) / 100;
      const movePrice = supplierBasePrice + commissionAmount;
      const totalAmount = movePrice + (packagingOrder.total_amount || 0);

      // Update move request with selected quote
      await base44.entities.MoveRequest.update(moveRequestId, {
        selected_quote_id: selectedQuoteId,
        status: 'confirmed',
        tc_accepted: true,
        tc_accepted_at: new Date().toISOString(),
        tc_version: '1.0',
      });

      // Update quote status
      await base44.entities.Quote.update(selectedQuoteId, {
        status: 'selected',
      });

      // Create booking with commission details
      const bookingRef = `HM${Date.now().toString(36).toUpperCase()}`;
      const booking = await base44.entities.Booking.create({
        move_request_id: moveRequestId,
        quote_id: selectedQuoteId,
        supplier_id: selectedQuote.supplier_id,
        customer_id: user?.id,
        status: 'pending_payment',
        booking_reference: bookingRef,
        move_date: moveDetails.move_date,
        time_window: moveDetails.time_window,
        distance_km: distanceKm,
        supplier_base_price: supplierBasePrice,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        total_amount: totalAmount,
        payment_status: 'pending',
      });

      // Log payment initiation
      await base44.entities.PaymentLog.create({
        booking_id: booking.id,
        amount: totalAmount,
        status: 'initiated',
      });

      // Navigate to payment page
      navigate(createPageUrl('Payment') + `?booking_id=${booking.id}`);
    } catch (e) {
      console.error('Error creating booking:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <MoveDetailsForm
            data={moveDetails}
            onChange={setMoveDetails}
            onNext={handleDetailsNext}
          />
        );
      case 1:
        return (
          <InventoryWizard
            items={inventoryItems}
            onChange={setInventoryItems}
            onNext={handleInventoryNext}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <PackagingSelector
            packagingOrder={packagingOrder}
            onChange={setPackagingOrder}
            inventoryItems={inventoryItems}
            onNext={handlePackagingNext}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <QuoteComparison
            moveRequest={moveDetails}
            quotes={quotes}
            selectedQuoteId={selectedQuoteId}
            onSelect={handleQuoteSelect}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <BookingConfirmation
            moveRequest={moveDetails}
            selectedQuote={selectedQuote}
            packagingOrder={packagingOrder}
            supplier={supplier}
            commissionRate={commissionRate}
            onConfirm={handleConfirmBooking}
            onBack={prevStep}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Plan Your Move</h1>
          <p className="text-gray-500">
            Complete these steps to get quotes from verified movers
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <MoveStepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}