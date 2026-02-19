import React, { useState } from 'react';
import { Check, Shield, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function BookingConfirmation({ 
  moveRequest, 
  selectedQuote,
  packagingOrder,
  supplier,
  commissionRate = 10,
  onConfirm, 
  onBack,
  loading 
}) {
  const [tcAccepted, setTcAccepted] = useState(false);

  // Calculate pricing with commission - match vehicle-specific rates like QuoteComparison
  const distanceKm = moveRequest?.distance_km || 0;
  const fleet = supplier?.fleet || [];
  const matchedVehicle = fleet.find(v => v.vehicle_type === selectedQuote?.vehicle_type) || fleet[0];
  const kmRate = matchedVehicle?.rate_per_km ?? supplier?.pricing?.rate_per_km ?? 0;
  const crewRate = matchedVehicle?.crew_member_rate ?? supplier?.pricing?.crew_member_rate ?? 0;
  const crewSize = matchedVehicle?.crew_size || selectedQuote?.crew_size || 0;
  const supplierBasePrice = (distanceKm * kmRate) + (crewSize * crewRate);
  
  // Calculate packaging costs from supplier's pricing
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
  
  // Add packing service cost if selected
  if (packagingOrder?.include_packing_service && supplier?.pricing?.packing_service_rate) {
    packagingTotal += supplier.pricing.packing_service_rate;
  }
  
  // Add shuttle service cost if selected
  if (packagingOrder?.include_shuttle_service && supplier?.pricing?.shuttle_service_rate) {
    packagingTotal += supplier.pricing.shuttle_service_rate;
  }
  
  const subtotal = supplierBasePrice + packagingTotal;
  const commissionAmount = (subtotal * commissionRate) / 100;
  const grandTotal = subtotal + commissionAmount;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Confirm Your Booking</h2>
        <p className="text-gray-500">Review your move details before proceeding to payment</p>
      </div>

      {/* Move Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Move Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">From</p>
              <p className="font-medium">{moveRequest?.pickup_address}</p>
              <p className="text-sm text-gray-500">
                {moveRequest?.pickup_city} {moveRequest?.pickup_postal_code}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">To</p>
              <p className="font-medium">{moveRequest?.dropoff_address}</p>
              <p className="text-sm text-gray-500">
                {moveRequest?.dropoff_city} {moveRequest?.dropoff_postal_code}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {moveRequest?.move_date 
                  ? new Date(moveRequest.move_date).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Window</p>
              <p className="font-medium capitalize">{moveRequest?.time_window || 'Morning'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Move Type</p>
              <p className="font-medium capitalize">{moveRequest?.move_type?.replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Mover */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Moving Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {matchedVehicle?.front_photo_url && (
                <img src={matchedVehicle.front_photo_url} alt="Vehicle" className="w-16 h-16 object-cover rounded-lg" />
              )}
              <div>
              <p className="font-semibold text-lg">{supplier?.company_name || 'Moving Company'}</p>
              <p className="text-sm text-gray-500">
                {matchedVehicle?.vehicle_type || selectedQuote?.vehicle_type}
                {matchedVehicle?.make && matchedVehicle?.model ? ` • ${matchedVehicle.make} ${matchedVehicle.model}` : ''}
                {matchedVehicle?.year ? ` (${matchedVehicle.year})` : ''}
                {` • ${crewSize} crew member${crewSize !== 1 ? 's' : ''}`}
              </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Quote Valid Until</p>
              <p className="font-medium">
                {selectedQuote?.valid_until 
                  ? new Date(selectedQuote.valid_until).toLocaleDateString()
                  : '7 days'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance</span>
              <span className="font-medium">{distanceKm.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Distance Cost ({distanceKm.toFixed(1)} km × R{kmRate}/km)</span>
              <span className="font-medium">R{(distanceKm * kmRate).toFixed(2)}</span>
            </div>
            {crewSize > 0 && crewRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Crew Cost ({crewSize} × R{crewRate}/crew)</span>
                <span className="font-medium">R{(crewSize * crewRate).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-2">
              <span className="text-gray-700">Supplier Base Price</span>
              <span>R{supplierBasePrice.toFixed(2)}</span>
            </div>
            {packagingTotal > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-600">Packaging & Services</span>
                  <span>R{packagingTotal.toFixed(2)}</span>
                </div>
                <div className="ml-4 space-y-1 text-sm">
                  {packagingOrder?.items?.map((item, idx) => {
                    const supplierItem = supplier?.pricing?.packaging_items?.find(
                      si => si.name === item.name && si.in_stock
                    );
                    const itemTotal = supplierItem ? supplierItem.unit_price * item.quantity : 0;
                    return (
                      <div key={idx} className="flex justify-between text-gray-500">
                        <span>{item.name} × {item.quantity}</span>
                        <span>R{itemTotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  {packagingOrder?.include_packing_service && supplier?.pricing?.packing_service_rate && (
                    <div className="flex justify-between text-gray-500">
                      <span>Professional Packing Service</span>
                      <span>R{supplier.pricing.packing_service_rate.toFixed(2)}</span>
                    </div>
                  )}
                  {packagingOrder?.include_shuttle_service && supplier?.pricing?.shuttle_service_rate && (
                    <div className="flex justify-between text-gray-500">
                      <span>Shuttle Service</span>
                      <span>R{supplier.pricing.shuttle_service_rate.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform Fee ({commissionRate}%)</span>
              <span className="text-gray-500">R{commissionAmount.toFixed(2)}</span>
            </div>
            <Separator />
          </div>

          <Separator />

          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total Amount</span>
            <span className="font-bold">R{grandTotal.toFixed(2)}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900">Pay Full Amount Now</span>
              <span className="font-bold text-blue-900 text-lg">R{grandTotal.toFixed(2)}</span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Single payment for your complete move - no additional charges on arrival
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="tc" 
              checked={tcAccepted}
              onCheckedChange={setTcAccepted}
            />
            <div className="space-y-1">
              <Label htmlFor="tc" className="cursor-pointer font-medium">
                I agree to the Terms & Conditions
              </Label>
              <p className="text-sm text-gray-500">
                By checking this box, you agree to our{' '}
                <a href="#" className="text-black underline">Terms of Service</a>,{' '}
                <a href="#" className="text-black underline">Privacy Policy</a>, and{' '}
                <a href="#" className="text-black underline">Cancellation Policy</a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 mb-1">Important Information</p>
              <ul className="text-amber-700 space-y-1">
                <li>• Only inventoried items will be moved. Request changes in-app if needed.</li>
                <li>• Any extras must be authorised by House Moves before payment.</li>
                <li>• Free cancellation up to 72 hours before move date.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Secure payment powered by PayFast</span>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={!tcAccepted || loading}
          className="bg-black text-white hover:bg-gray-800 min-w-[200px]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              Proceed to Payment R{grandTotal.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}