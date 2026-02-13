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
  onConfirm, 
  onBack,
  loading 
}) {
  const [tcAccepted, setTcAccepted] = useState(false);

  const depositAmount = selectedQuote?.total_price ? selectedQuote.total_price * 0.5 : 0;
  const balanceAmount = selectedQuote?.total_price ? selectedQuote.total_price * 0.5 : 0;
  const packagingTotal = packagingOrder?.total_amount || 0;
  const grandTotal = (selectedQuote?.total_price || 0) + packagingTotal;

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
            <div>
              <p className="font-semibold text-lg">{supplier?.company_name || 'Moving Company'}</p>
              <p className="text-sm text-gray-500">
                {selectedQuote?.vehicle_type} • {selectedQuote?.crew_size} crew members
              </p>
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
              <span className="text-gray-600">Moving Service</span>
              <span className="font-medium">R{selectedQuote?.total_price?.toLocaleString()}</span>
            </div>
            {packagingTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Packaging Materials</span>
                <span className="font-medium">R{packagingTotal.toLocaleString()}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold">R{grandTotal.toLocaleString()}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-emerald-700">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Deposit (pay now)
              </span>
              <span className="font-semibold">R{depositAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                Balance (on arrival)
              </span>
              <span>R{balanceAmount.toLocaleString()}</span>
            </div>
            {packagingTotal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  Packaging (with deposit)
                </span>
                <span>Included</span>
              </div>
            )}
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
              Pay Deposit R{(depositAmount + packagingTotal).toLocaleString()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}