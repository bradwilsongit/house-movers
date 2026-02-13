import React, { useState, useEffect } from 'react';
import { Star, Truck, Users, Clock, Shield, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function QuoteComparison({ 
  moveRequest, 
  quotes, 
  selectedQuoteId,
  onSelect,
  onNext, 
  onBack 
}) {
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, [quotes]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const supplierIds = [...new Set(quotes.map(q => q.supplier_id))];
      const supplierData = {};
      for (const id of supplierIds) {
        try {
          const supplier = await base44.entities.Supplier.filter({ id });
          if (supplier.length > 0) {
            supplierData[id] = supplier[0];
          }
        } catch (e) {
          console.error('Error loading supplier:', e);
        }
      }
      setSuppliers(supplierData);
    } catch (e) {
      console.error('Error loading suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading quotes...</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">Waiting for Quotes</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          We're gathering quotes from verified movers in your area. 
          This usually takes 2-4 hours.
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to Details
        </Button>
      </div>
    );
  }

  const sortedQuotes = [...quotes].sort((a, b) => a.total_price - b.total_price);
  const lowestPrice = sortedQuotes[0]?.total_price;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gray-50 border-0">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">From: </span>
              <span className="font-medium">{moveRequest?.pickup_city || 'Pickup'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500">To: </span>
              <span className="font-medium">{moveRequest?.dropoff_city || 'Dropoff'}</span>
            </div>
            <div>
              <span className="text-gray-500">Date: </span>
              <span className="font-medium">
                {moveRequest?.move_date ? new Date(moveRequest.move_date).toLocaleDateString() : 'TBD'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold">
        {quotes.length} Quote{quotes.length > 1 ? 's' : ''} Available
      </h2>

      {/* Quotes List */}
      <RadioGroup value={selectedQuoteId || ''} onValueChange={onSelect}>
        <div className="space-y-4">
          {sortedQuotes.map((quote, index) => {
            const supplier = suppliers[quote.supplier_id];
            const isLowest = quote.total_price === lowestPrice;
            const isSelected = selectedQuoteId === quote.id;

            return (
              <Label
                key={quote.id}
                htmlFor={quote.id}
                className="block cursor-pointer"
              >
                <Card className={cn(
                  "transition-all",
                  isSelected 
                    ? "border-2 border-black shadow-lg" 
                    : "border-2 border-transparent hover:border-gray-200"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value={quote.id} id={quote.id} className="mt-1" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {supplier?.company_name || 'Moving Company'}
                              </h3>
                              {isLowest && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  Best Price
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {supplier?.rating_average > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  {supplier.rating_average.toFixed(1)}
                                </span>
                              )}
                              {supplier?.total_jobs > 0 && (
                                <span>{supplier.total_jobs} moves completed</span>
                              )}
                              {supplier?.on_time_rate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {supplier.on_time_rate}% on-time
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-3xl font-bold">
                              R{quote.total_price?.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">total estimate</p>
                          </div>
                        </div>

                        {/* Quote Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Vehicle</p>
                              <p className="text-sm font-medium">{quote.vehicle_type || 'Standard'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Crew</p>
                              <p className="text-sm font-medium">{quote.crew_size || 2} men</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Duration</p>
                              <p className="text-sm font-medium">~{quote.estimated_duration_hours || 4} hours</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Insurance</p>
                              <p className="text-sm font-medium">Included</p>
                            </div>
                          </div>
                        </div>

                        {/* Included Services */}
                        {quote.included_services?.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Included:</p>
                            <div className="flex flex-wrap gap-2">
                              {quote.included_services.map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-gray-100">
                                  <Check className="w-3 h-3 mr-1" />
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {quote.notes && (
                          <p className="text-sm text-gray-500 mt-3 italic">
                            "{quote.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            );
          })}
        </div>
      </RadioGroup>

      {/* Payment Info */}
      {selectedQuoteId && (
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Secure Payment</p>
                <p className="text-sm text-blue-700">
                  Pay 50% deposit now to confirm your booking. 
                  The remaining 50% is due when the mover arrives.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!selectedQuoteId}
          className="bg-black text-white hover:bg-gray-800"
        >
          Book This Quote
        </Button>
      </div>
    </div>
  );
}