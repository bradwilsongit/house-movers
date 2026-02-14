import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Clock, Building2, Truck, Loader2, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MoveDetailsForm({ data, onChange, onNext }) {
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState(null);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const calculateDistance = async () => {
    if (!data.pickup_address || !data.dropoff_address) {
      setDistanceError('Please enter both pickup and dropoff addresses');
      return;
    }

    setCalculatingDistance(true);
    setDistanceError(null);

    try {
      // Load Google Maps API key from settings
      const settings = await base44.entities.AppSettings.list();
      const apiKey = settings[0]?.google_maps_api_key;
      
      if (!apiKey) {
        throw new Error('Google Maps API key not configured. Please contact administrator.');
      }

      // Use Distance Matrix API for accurate road distance
      const origin = `${data.pickup_address}, ${data.pickup_city || ''}, South Africa`;
      const destination = `${data.dropoff_address}, ${data.dropoff_city || ''}, South Africa`;
      
      // Use CORS proxy or make the call through a backend
      // For now, using a simple fetch approach (Note: may need backend proxy for production)
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=metric&key=${apiKey}`;
      
      // Note: Direct browser calls to Google Maps API may be blocked by CORS
      // In production, this should go through a backend endpoint
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to calculate distance. API request failed.');
      }

      const result = await response.json();
      
      if (result.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API request denied. Check API key and enabled APIs.');
      }
      
      if (result.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = result.rows[0].elements[0];
        const distanceKm = element.distance.value / 1000; // Convert meters to kilometers
        const durationMinutes = Math.ceil(element.duration.value / 60); // Convert seconds to minutes

        onChange({
          ...data,
          distance_km: distanceKm,
          distance_duration_minutes: durationMinutes,
        });
      } else if (result.rows?.[0]?.elements?.[0]?.status === 'ZERO_RESULTS') {
        throw new Error('No route found between these addresses. Please verify addresses.');
      } else {
        throw new Error('Could not calculate distance. Please check addresses are valid.');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      setDistanceError(error.message || 'Unable to calculate distance. Please verify addresses and try again.');
    } finally {
      setCalculatingDistance(false);
    }
  };

  const handleAccessChange = (type, field, value) => {
    const accessKey = type === 'pickup' ? 'pickup_access' : 'dropoff_access';
    onChange({
      ...data,
      [accessKey]: {
        ...data[accessKey],
        [field]: value
      }
    });
  };

  const moveTypes = [
    { value: 'apartment', label: 'Apartment', icon: Building2 },
    { value: 'house', label: 'House', icon: Building2 },
    { value: 'office', label: 'Office', icon: Building2 },
    { value: 'long_distance', label: 'Long Distance', icon: Truck },
  ];

  const timeWindows = [
    { value: 'morning', label: 'Morning', time: '8:00 AM - 12:00 PM' },
    { value: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:00 PM' },
    { value: 'full_day', label: 'Full Day', time: 'Flexible timing' },
  ];

  const isValid = data.pickup_address && data.dropoff_address && data.move_date && data.move_type;

  const handleNext = async () => {
    if (isValid && !data.distance_km) {
      await calculateDistance();
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {data.distance_km && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Route className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Distance Calculated</p>
            <p className="text-sm text-blue-700">
              {data.distance_km.toFixed(1)} km • Estimated {Math.floor(data.distance_duration_minutes / 60)}h {data.distance_duration_minutes % 60}m travel time
            </p>
          </div>
        </div>
      )}
      
      {distanceError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {distanceError}
        </div>
      )}
      {/* Move Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What type of move is this?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.move_type}
            onValueChange={(value) => handleChange('move_type', value)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {moveTypes.map((type) => (
              <Label
                key={type.value}
                htmlFor={type.value}
                className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  data.move_type === type.value
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                <type.icon className="w-6 h-6 mb-2" />
                <span className="font-medium">{type.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Pickup & Dropoff Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pickup Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-xs">A</span>
              </div>
              Pickup Location
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="pickup_address">Street Address</Label>
                <Input
                  id="pickup_address"
                  placeholder="123 Main Street"
                  value={data.pickup_address || ''}
                  onChange={(e) => handleChange('pickup_address', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pickup_city">City</Label>
                <Input
                  id="pickup_city"
                  placeholder="Cape Town"
                  value={data.pickup_city || ''}
                  onChange={(e) => handleChange('pickup_city', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pickup_postal_code">Postal Code</Label>
                <Input
                  id="pickup_postal_code"
                  placeholder="8001"
                  value={data.pickup_postal_code || ''}
                  onChange={(e) => handleChange('pickup_postal_code', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Pickup Access Details */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <p className="text-sm font-medium">Access Details</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Floor</Label>
                  <Select
                    value={data.pickup_access?.floor?.toString() || '0'}
                    onValueChange={(v) => handleAccessChange('pickup', 'floor', parseInt(v))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(21)].map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? 'Ground Floor' : `Floor ${i}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Distance to Truck</Label>
                  <Select
                    value={data.pickup_access?.distance_to_truck || 'close'}
                    onValueChange={(v) => handleAccessChange('pickup', 'distance_to_truck', v)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close">Close (under 20m)</SelectItem>
                      <SelectItem value="medium">Medium (20-50m)</SelectItem>
                      <SelectItem value="long_carry">Long Carry (50m+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="pickup_lift"
                    checked={data.pickup_access?.has_lift || false}
                    onCheckedChange={(v) => handleAccessChange('pickup', 'has_lift', v)}
                  />
                  <Label htmlFor="pickup_lift" className="cursor-pointer">Has Lift</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="pickup_parking"
                    checked={data.pickup_access?.parking_available || false}
                    onCheckedChange={(v) => handleAccessChange('pickup', 'parking_available', v)}
                  />
                  <Label htmlFor="pickup_parking" className="cursor-pointer">Parking Available</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="pickup_narrow"
                    checked={data.pickup_access?.narrow_access || false}
                    onCheckedChange={(v) => handleAccessChange('pickup', 'narrow_access', v)}
                  />
                  <Label htmlFor="pickup_narrow" className="cursor-pointer">Narrow Access</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Dropoff Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">B</span>
              </div>
              Dropoff Location
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="dropoff_address">Street Address</Label>
                <Input
                  id="dropoff_address"
                  placeholder="456 Oak Avenue"
                  value={data.dropoff_address || ''}
                  onChange={(e) => handleChange('dropoff_address', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="dropoff_city">City</Label>
                <Input
                  id="dropoff_city"
                  placeholder="Johannesburg"
                  value={data.dropoff_city || ''}
                  onChange={(e) => handleChange('dropoff_city', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="dropoff_postal_code">Postal Code</Label>
                <Input
                  id="dropoff_postal_code"
                  placeholder="2001"
                  value={data.dropoff_postal_code || ''}
                  onChange={(e) => handleChange('dropoff_postal_code', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Dropoff Access Details */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <p className="text-sm font-medium">Access Details</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Floor</Label>
                  <Select
                    value={data.dropoff_access?.floor?.toString() || '0'}
                    onValueChange={(v) => handleAccessChange('dropoff', 'floor', parseInt(v))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(21)].map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? 'Ground Floor' : `Floor ${i}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Distance to Truck</Label>
                  <Select
                    value={data.dropoff_access?.distance_to_truck || 'close'}
                    onValueChange={(v) => handleAccessChange('dropoff', 'distance_to_truck', v)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close">Close (under 20m)</SelectItem>
                      <SelectItem value="medium">Medium (20-50m)</SelectItem>
                      <SelectItem value="long_carry">Long Carry (50m+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="dropoff_lift"
                    checked={data.dropoff_access?.has_lift || false}
                    onCheckedChange={(v) => handleAccessChange('dropoff', 'has_lift', v)}
                  />
                  <Label htmlFor="dropoff_lift" className="cursor-pointer">Has Lift</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="dropoff_parking"
                    checked={data.dropoff_access?.parking_available || false}
                    onCheckedChange={(v) => handleAccessChange('dropoff', 'parking_available', v)}
                  />
                  <Label htmlFor="dropoff_parking" className="cursor-pointer">Parking Available</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="dropoff_narrow"
                    checked={data.dropoff_access?.narrow_access || false}
                    onCheckedChange={(v) => handleAccessChange('dropoff', 'narrow_access', v)}
                  />
                  <Label htmlFor="dropoff_narrow" className="cursor-pointer">Narrow Access</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            When do you want to move?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="move_date">Move Date</Label>
            <Input
              id="move_date"
              type="date"
              value={data.move_date || ''}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleChange('move_date', e.target.value)}
              className="mt-1.5 max-w-xs"
            />
          </div>

          <div>
            <Label className="mb-3 block">Preferred Time Window</Label>
            <RadioGroup
              value={data.time_window || 'morning'}
              onValueChange={(value) => handleChange('time_window', value)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {timeWindows.map((tw) => (
                <Label
                  key={tw.value}
                  htmlFor={`time-${tw.value}`}
                  className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    data.time_window === tw.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={tw.value} id={`time-${tw.value}`} className="sr-only" />
                  <span className="font-medium">{tw.label}</span>
                  <span className="text-sm text-gray-500">{tw.time}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Special Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Special Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="dismantling"
                checked={data.special_requirements?.dismantling_required || false}
                onCheckedChange={(v) => handleChange('special_requirements', {
                  ...data.special_requirements,
                  dismantling_required: v
                })}
              />
              <Label htmlFor="dismantling" className="cursor-pointer">Dismantling Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="hoisting"
                checked={data.special_requirements?.hoisting_required || false}
                onCheckedChange={(v) => handleChange('special_requirements', {
                  ...data.special_requirements,
                  hoisting_required: v
                })}
              />
              <Label htmlFor="hoisting" className="cursor-pointer">Hoisting Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="shuttle"
                checked={data.special_requirements?.shuttle_service || false}
                onCheckedChange={(v) => handleChange('special_requirements', {
                  ...data.special_requirements,
                  shuttle_service: v
                })}
              />
              <Label htmlFor="shuttle" className="cursor-pointer">Shuttle Service</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="heavy"
                checked={data.special_requirements?.heavy_items || false}
                onCheckedChange={(v) => handleChange('special_requirements', {
                  ...data.special_requirements,
                  heavy_items: v
                })}
              />
              <Label htmlFor="heavy" className="cursor-pointer">Heavy Items (4+ men)</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any other details we should know about..."
              value={data.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleNext} 
          disabled={!isValid || calculatingDistance}
          className="bg-black text-white hover:bg-gray-800"
        >
          {calculatingDistance ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating Distance...
            </>
          ) : (
            'Continue to Inventory'
          )}
        </Button>
      </div>
    </div>
  );
}