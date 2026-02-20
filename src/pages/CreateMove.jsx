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
import { emailCustomerBookingConfirmed, emailAdminsNewBooking } from '@/components/emailUtils';

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
    // Check for existing draft move request from URL
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft_id');
    if (draftId && user) {
      loadDraftMove(draftId);
    }
  }, [user]);

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

  const loadDraftMove = async (draftId) => {
    setLoading(true);
    try {
      // Load move request
      const moveRequests = await base44.entities.MoveRequest.filter({ id: draftId });
      if (moveRequests.length === 0) {
        setLoading(false);
        return;
      }
      
      const moveRequest = moveRequests[0];
      setMoveRequestId(moveRequest.id);
      setMoveDetails(moveRequest);

      // Load inventory items
      const inventory = await base44.entities.InventoryItem.filter({ move_request_id: draftId });
      setInventoryItems(inventory);

      // Load packaging order
      const packaging = await base44.entities.PackagingOrder.filter({ move_request_id: draftId });
      if (packaging.length > 0) {
        setPackagingOrder(packaging[0]);
      }

      // Load quotes
      const moveQuotes = await base44.entities.Quote.filter({ move_request_id: draftId });
      setQuotes(moveQuotes);

      if (moveRequest.selected_quote_id) {
        setSelectedQuoteId(moveRequest.selected_quote_id);
      }

      // Determine which step to show based on saved data
      // If distance not calculated, must go back to details step
      if (!moveRequest.distance_km || moveRequest.distance_km <= 0) {
        setCurrentStep(0); // Details step - need to recalculate distance
      } else if (moveRequest.status === 'confirmed' || moveRequest.selected_quote_id) {
        setCurrentStep(4); // Confirmation step
      } else if (moveQuotes.length > 0) {
        setCurrentStep(3); // Quotes step
      } else if (packaging.length > 0) {
        setCurrentStep(2); // Packaging step
      } else if (inventory.length > 0) {
        setCurrentStep(1); // Inventory step
      } else {
        setCurrentStep(0); // Details step
      }
    } catch (e) {
      console.error('Error loading draft move:', e);
    } finally {
      setLoading(false);
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
    // Save or update move request
    setLoading(true);
    try {
      if (moveRequestId) {
        // Update existing draft
        await base44.entities.MoveRequest.update(moveRequestId, {
          ...moveDetails,
          status: 'draft',
        });
      } else {
        // Create new move request
        const moveRequest = await base44.entities.MoveRequest.create({
          ...moveDetails,
          customer_id: user?.id,
          status: 'draft',
        });
        setMoveRequestId(moveRequest.id);
      }
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
      // Delete existing inventory items for this move
      const existingItems = await base44.entities.InventoryItem.filter({ move_request_id: moveRequestId });
      for (const item of existingItems) {
        await base44.entities.InventoryItem.delete(item.id);
      }

      // Create new inventory items
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

      // Generate demo quotes if not already generated
      if (quotes.length === 0) {
        await generateDemoQuotes();
      }
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
      // Delete existing packaging order if any
      const existingOrders = await base44.entities.PackagingOrder.filter({ move_request_id: moveRequestId });
      for (const order of existingOrders) {
        await base44.entities.PackagingOrder.delete(order.id);
      }

      // Create new packaging order
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
      // Validate all required fields for pricing
      const distanceKm = moveDetails.distance_km;
      if (!distanceKm || distanceKm <= 0) {
        alert('Distance calculation failed. Please go back and verify addresses.');
        setLoading(false);
        return;
      }

      if (!commissionRate || commissionRate < 0) {
        alert('Commission rate not configured. Please contact administrator.');
        setLoading(false);
        return;
      }

      // Calculate pricing — use vehicle-specific rates (same as BookingConfirmation & QuoteComparison)
      const fleet = supplier?.fleet || [];
      const matchedVehicle = fleet.find(v => v.vehicle_type === selectedQuote?.vehicle_type) || fleet[0];
      const kmRate = matchedVehicle?.rate_per_km ?? supplier?.pricing?.rate_per_km ?? 0;
      const crewRate = matchedVehicle?.crew_member_rate ?? supplier?.pricing?.crew_member_rate ?? 0;
      const crewSize = matchedVehicle?.crew_size || selectedQuote?.crew_size || 0;
      const supplierBasePrice = (distanceKm * kmRate) + (crewSize * crewRate);
      let packagingTotal = 0;
      if (packagingOrder?.items?.length > 0 && supplier?.pricing?.packaging_items) {
        packagingOrder.items.forEach(selectedItem => {
          const supplierItem = supplier.pricing.packaging_items.find(
            item => item.name === selectedItem.name && item.in_stock
          );
          if (supplierItem) {
            packagingTotal += supplierItem.unit_price * selectedItem.quantity;
          }
        });
      }
      if (packagingOrder?.include_packing_service && supplier?.pricing?.packing_service_rate) {
        packagingTotal += supplier.pricing.packing_service_rate;
      }
      if (packagingOrder?.include_shuttle_service && supplier?.pricing?.shuttle_service_rate) {
        packagingTotal += supplier.pricing.shuttle_service_rate;
      }
      const subtotal = supplierBasePrice + packagingTotal;
      const commissionAmount = (subtotal * commissionRate) / 100;
      const totalAmount = subtotal + commissionAmount;

      if (totalAmount <= 0) {
        alert('Invalid booking total. Please try again.');
        setLoading(false);
        return;
      }

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

      // Send email notifications
      const allUsers = await base44.entities.User.list();
      const admins = allUsers.filter(u => u.role === 'admin');
      const customer = allUsers.find(u => u.id === user?.id);
      if (customer?.email) {
        emailCustomerBookingConfirmed({ customerEmail: customer.email, customerName: customer.full_name, booking });
      }
      emailAdminsNewBooking({ admins, booking });

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
            packagingOrder={packagingOrder}
            commissionRate={commissionRate}
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