import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Package, Check, ShoppingCart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import PayFastPayment from '@/components/PayFastPayment';

const DEFAULT_PACKAGING = [
  { id: '1', name: 'Large Box', description: '60x40x40cm - Ideal for bedding, clothes', category: 'boxes', unit_price: 45 },
  { id: '2', name: 'Medium Box', description: '40x30x30cm - Books, kitchen items', category: 'boxes', unit_price: 35 },
  { id: '3', name: 'Small Box', description: '30x20x20cm - Fragile items', category: 'boxes', unit_price: 25 },
  { id: '4', name: 'Wardrobe Box', description: 'Hanging clothes box', category: 'boxes', unit_price: 120 },
  { id: '5', name: 'Bubble Wrap (10m)', description: 'Protection for fragile items', category: 'wrapping', unit_price: 85 },
  { id: '6', name: 'Packing Paper (5kg)', description: 'For wrapping items', category: 'wrapping', unit_price: 65 },
  { id: '7', name: 'Packing Tape', description: 'Heavy duty tape roll', category: 'tape', unit_price: 35 },
  { id: '8', name: 'Moving Blanket', description: 'Furniture protection', category: 'blankets', unit_price: 80 },
  { id: '9', name: 'Mattress Cover', description: 'Single/Double size', category: 'specialty', unit_price: 95 },
  { id: '10', name: 'TV Box', description: 'For 50"+ screens', category: 'specialty', unit_price: 150 },
];

const CATEGORIES = [
  { id: 'boxes', label: 'Boxes', icon: '📦' },
  { id: 'wrapping', label: 'Wrapping', icon: '🎁' },
  { id: 'tape', label: 'Tape & Supplies', icon: '🔧' },
  { id: 'blankets', label: 'Blankets', icon: '🛡️' },
  { id: 'specialty', label: 'Specialty', icon: '⭐' },
];

export default function CustomerExtras() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [packagingItems, setPackagingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('select_booking'); // select_booking | select_items | payment
  const [payfastData, setPayfastData] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl('CustomerExtras'));
      return;
    }
    const userData = await base44.auth.me();
    setUser(userData);

    const [userBookings, items, appSettings] = await Promise.all([
      base44.entities.Booking.filter({ customer_id: userData.id }, '-created_date'),
      base44.entities.PackagingItem.filter({ is_active: true }),
      base44.entities.AppSettings.list(),
    ]);

    // Only active bookings (during the move)
    const activeBookings = userBookings.filter(b =>
      ['confirmed', 'driver_assigned', 'on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(b.status)
    );
    setBookings(activeBookings);
    setPackagingItems(items.length > 0 ? items : DEFAULT_PACKAGING);
    if (appSettings.length > 0) setSettings(appSettings[0]);
    setLoading(false);
  };

  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking);
    // Load supplier for this booking
    const suppliers = await base44.entities.Supplier.filter({ id: booking.supplier_id });
    if (suppliers.length > 0) setSupplier(suppliers[0]);
    setStep('select_items');
  };

  const updateQuantity = (itemId, delta) => {
    const item = packagingItems.find(p => p.id === itemId);
    const existing = selectedItems.find(i => i.packaging_item_id === itemId);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setSelectedItems(selectedItems.filter(i => i.packaging_item_id !== itemId));
      } else {
        setSelectedItems(selectedItems.map(i =>
          i.packaging_item_id === itemId ? { ...i, quantity: newQty, total_price: newQty * i.unit_price } : i
        ));
      }
    } else if (delta > 0 && item) {
      setSelectedItems([...selectedItems, {
        packaging_item_id: itemId,
        name: item.name,
        quantity: 1,
        unit_price: item.unit_price,
        total_price: item.unit_price,
      }]);
    }
  };

  const getQuantity = (itemId) => selectedItems.find(i => i.packaging_item_id === itemId)?.quantity || 0;

  const totalAmount = selectedItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);

  const handleProceedToPayment = async () => {
    if (selectedItems.length === 0 || !selectedBooking) return;
    setSubmitting(true);
    try {
      // Create an ExtraRequest record
      const description = selectedItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
      const extraRequest = await base44.entities.ExtraRequest.create({
        booking_id: selectedBooking.id,
        supplier_id: selectedBooking.supplier_id,
        request_type: 'additional_materials',
        description,
        amount: totalAmount,
        status: 'pending',
      });

      // Build payfast booking-like object for payment
      setPayfastData({
        id: extraRequest.id,
        booking_reference: `EXT-${selectedBooking.booking_reference}`,
        total_amount: totalAmount,
        customer_name: user.full_name?.split(' ')[0] || 'Customer',
        customer_surname: user.full_name?.split(' ').slice(1).join(' ') || '',
        customer_email: user.email,
        pickup_address: 'Extra Materials',
        dropoff_address: description,
        extra_request_id: extraRequest.id,
      });

      setStep('payment');
    } catch (e) {
      console.error('Error creating extra request:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Order Extra Materials</h1>
          <p className="text-gray-500 mt-1">Need more packing materials during your move? Order them here.</p>
        </div>

        {/* Step: Select Booking */}
        {step === 'select_booking' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active moves</h3>
                  <p className="text-gray-500 text-sm">Extra materials can only be ordered during an active move.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-medium">Select your active move:</p>
                {bookings.map(booking => (
                  <Card
                    key={booking.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-black"
                    onClick={() => handleSelectBooking(booking)}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Booking #{booking.booking_reference}</p>
                        <p className="text-sm text-gray-500 mt-1">Move date: {booking.move_date}</p>
                        <Badge className="mt-2 bg-emerald-100 text-emerald-700 capitalize">{booking.status.replace('_', ' ')}</Badge>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Step: Select Items */}
        {step === 'select_items' && (
          <div className="space-y-6">
            {/* Booking context */}
            <Card className="bg-gray-50 border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Active Move</p>
                  <p className="font-semibold">#{selectedBooking?.booking_reference}</p>
                  {supplier && <p className="text-sm text-gray-500">{supplier.company_name}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => { setStep('select_booking'); setSelectedItems([]); }}>
                  Change
                </Button>
              </CardContent>
            </Card>

            {/* Item selector */}
            {CATEGORIES.map(category => {
              const catItems = packagingItems.filter(p => p.category === category.id);
              if (catItems.length === 0) return null;
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{category.icon}</span> {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {catItems.map(item => {
                      const qty = getQuantity(item.id);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                            qty > 0 ? "border-black bg-gray-50" : "border-transparent bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {qty > 0 && (
                              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                              <p className="text-sm font-semibold mt-0.5">R{item.unit_price}</p>
                            </div>
                          </div>
                          <div className="flex items-center bg-white rounded-lg border">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">{qty}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}

            {/* Order summary + CTA */}
            <Card className="sticky bottom-4 shadow-lg border-2 border-black">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-semibold">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <span className="text-2xl font-bold">R{totalAmount.toLocaleString()}</span>
                </div>
                {selectedItems.length > 0 && (
                  <div className="text-xs text-gray-500 mb-4 space-y-0.5">
                    {selectedItems.map(i => (
                      <p key={i.packaging_item_id}>{i.quantity}x {i.name} — R{(i.unit_price * i.quantity).toLocaleString()}</p>
                    ))}
                  </div>
                )}
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800"
                  disabled={selectedItems.length === 0 || submitting}
                  onClick={handleProceedToPayment}
                >
                  {submitting ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && payfastData && settings && (
          <div className="space-y-6">
            <Card className="bg-gray-50 border-0">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order Summary</p>
                {selectedItems.map(i => (
                  <div key={i.packaging_item_id} className="flex justify-between text-sm py-1">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-medium">R{(i.unit_price * i.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R{totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <PayFastPayment
              booking={payfastData}
              settings={settings}
              onPaymentInitiated={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}