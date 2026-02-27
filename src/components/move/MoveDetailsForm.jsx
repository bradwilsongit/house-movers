import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Clock, Building2, Truck, Loader2, Route, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

export default function MoveDetailsForm({ data, onChange, onNext }) {
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadingKey, setLoadingKey] = useState(true);
  const [keyError, setKeyError] = useState(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      console.log('[MoveDetailsForm] Fetching Google Maps API key from AppSettings...');
      const settings = await base44.entities.AppSettings.list();
      
      console.log('[MoveDetailsForm] Settings fetched:', {
        count: settings.length,
        hasKey: settings.length > 0 && !!settings[0].google_maps_api_key,
        keyPrefix: settings[0]?.google_maps_api_key?.substring(0, 10)
      });

      if (settings.length > 0 && settings[0].google_maps_api_key) {
        setApiKey(settings[0].google_maps_api_key);
        setKeyError(null);
        console.log('[MoveDetailsForm] ✓ API key loaded successfully');
      } else {
        const error = 'Google Maps API key not configured in Admin settings';
        console.error('[MoveDetailsForm] ✗', error);
        setKeyError(error);
      }
    } catch (e) {
      console.error('[MoveDetailsForm] Error loading API key:', e);
      setKeyError(`Failed to load settings: ${e.message}`);
    } finally {
      setLoadingKey(false);
    }
  };

  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handlePickupChange = (placeData) => {
    console.log('[MoveDetailsForm] Pickup place selected:', placeData);
    onChange(prev => ({
      ...prev,
      pickup_address: placeData.address,
      pickup_city: placeData.city,
      pickup_postal_code: placeData.postal_code,
      pickup_place_id: placeData.place_id,
      pickup_lat: placeData.lat,
      pickup_lng: placeData.lng,
      // Clear distance when addresses change
      distance_km: null,
      distance_duration_minutes: null,
      distance_calculation_status: null,
    }));
    setErrors(prev => ({ ...prev, pickup: null }));
    
    // Debug log to verify state update
    setTimeout(() => {
      console.log('[MoveDetailsForm] State after pickup update should contain:', {
        pickup_place_id: placeData.place_id,
        pickup_lat: placeData.lat,
        pickup_lng: placeData.lng
      });
    }, 0);
  };

  const handleDropoffChange = (placeData) => {
    console.log('[MoveDetailsForm] ✅ Dropoff received:', placeData);
    onChange(prev => ({
      ...prev,
      dropoff_address: placeData.address,
      dropoff_city: placeData.city,
      dropoff_postal_code: placeData.postal_code,
      dropoff_place_id: placeData.place_id,
      dropoff_lat: placeData.lat,
      dropoff_lng: placeData.lng,
      // Clear distance when addresses change
      distance_km: null,
      distance_duration_minutes: null,
      distance_calculation_status: null,
    }));
    setErrors(prev => ({ ...prev, dropoff: null }));
    
    // Debug log to verify state update
    setTimeout(() => {
      console.log('[MoveDetailsForm] State after dropoff update should contain:', {
        dropoff_place_id: placeData.place_id,
        dropoff_lat: placeData.lat,
        dropoff_lng: placeData.lng
      });
    }, 0);
  };

  const calculateDistance = async () => {
    if (!data.pickup_place_id || !data.dropoff_place_id) {
      setDistanceError('Please select both pickup and dropoff addresses from the Google suggestions');
      return false;
    }

    if (!data.pickup_lat || !data.pickup_lng || !data.dropoff_lat || !data.dropoff_lng) {
      setDistanceError('Address coordinates missing. Please reselect addresses from dropdown.');
      return false;
    }

    setCalculatingDistance(true);
    setDistanceError(null);

    try {
      // Wait for Google Maps API to be loaded
      if (!window.google?.maps?.DistanceMatrixService) {
        throw new Error('Google Maps API not loaded. Please refresh the page.');
      }

      console.log('Distance Matrix Request:', {
        origin: { lat: data.pickup_lat, lng: data.pickup_lng },
        destination: { lat: data.dropoff_lat, lng: data.dropoff_lng }
      });

      // Use JavaScript API instead of HTTP endpoint to avoid CORS
      const service = new window.google.maps.DistanceMatrixService();
      
      const result = await new Promise((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [{ lat: data.pickup_lat, lng: data.pickup_lng }],
            destinations: [{ lat: data.dropoff_lat, lng: data.dropoff_lng }],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK') {
              resolve(response);
            } else {
              reject(new Error(`Distance Matrix failed: ${status}`));
            }
          }
        );
      });

      console.log('Distance Matrix Response:', result);

      const element = result.rows?.[0]?.elements?.[0];
      
      if (!element) {
        throw new Error('No distance data returned from Google API');
      }
      
      if (element.status === 'OK') {
        const distanceKm = element.distance.value / 1000;
        const durationMinutes = Math.ceil(element.duration.value / 60);

        console.log('Distance Calculated:', { distanceKm, durationMinutes });

        onChange(prev => ({
          ...prev,
          distance_km: distanceKm,
          distance_duration_minutes: durationMinutes,
          distance_calculation_status: 'OK',
        }));

        setCalculatingDistance(false);
        return true;
      } else if (element.status === 'ZERO_RESULTS') {
        throw new Error('No route found between these locations. Please verify addresses.');
      } else if (element.status === 'NOT_FOUND') {
        throw new Error('One or both addresses could not be geocoded. Please reselect from dropdown.');
      } else {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      const errorMsg = error.message || 'Unable to calculate distance. Please try again.';
      setDistanceError(errorMsg);
      
      onChange(prev => ({
        ...prev,
        distance_calculation_status: errorMsg,
      }));
      
      setCalculatingDistance(false);
      return false;
    }
  };

  const handleAccessChange = (type, field, value) => {
    const accessKey = type === 'pickup' ? 'pickup_access' : 'dropoff_access';
    onChange(prev => ({
      ...prev,
      [accessKey]: {
        ...prev[accessKey],
        [field]: value
      }
    }));
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

  // Minimum date: 1 week from today
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const handleNext = async () => {
    console.log('[MoveDetailsForm] Validating form data:', {
      move_type: data.move_type,
      pickup_place_id: data.pickup_place_id,
      pickup_lat: data.pickup_lat,
      pickup_lng: data.pickup_lng,
      dropoff_place_id: data.dropoff_place_id,
      dropoff_lat: data.dropoff_lat,
      dropoff_lng: data.dropoff_lng,
      move_date: data.move_date,
    });
    
    const newErrors = {};

    if (!data.move_type) newErrors.move_type = 'Select move type';
    
    // Validate that place was selected (not just typed)
    if (!data.pickup_place_id || !data.pickup_lat || !data.pickup_lng) {
      newErrors.pickup = 'Please select pickup address from dropdown';
    }
    if (!data.dropoff_place_id || !data.dropoff_lat || !data.dropoff_lng) {
      newErrors.dropoff = 'Please select dropoff address from dropdown';
    }
    
    if (!data.move_date && !data.date_flexible) newErrors.move_date = 'Select a move date or mark as flexible';

    if (Object.keys(newErrors).length > 0) {
      console.log('[MoveDetailsForm] ❌ Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    const success = await calculateDistance();
    
    if (!success) {
      return;
    }
    
    console.log('[MoveDetailsForm] ✓ Validation passed, proceeding to next step');
    onNext();
  };
  
  // Check if minimum required fields are filled
  const canContinue = data.move_type && 
                      data.pickup_place_id && 
                      data.dropoff_place_id && 
                      (data.move_date || data.date_flexible);

  return (
    <div className="space-y-8">
      {/* Debug Info (temporary) */}
      {loadingKey && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-900">
            Loading Google Maps configuration...
          </AlertDescription>
        </Alert>
      )}

      {keyError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Configuration Error</strong>
            <p className="text-sm mt-1">{keyError}</p>
            <p className="text-xs mt-2 text-red-700">
              Admin: Configure Google Maps API key in Settings → Branding & API Keys
            </p>
          </AlertDescription>
        </Alert>
      )}

      {data.distance_km && (
        <Alert className="border-green-200 bg-green-50">
          <Route className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Distance: {data.distance_km.toFixed(1)} km</strong>
            <p className="text-sm mt-1">
              Estimated travel time: {Math.floor(data.distance_duration_minutes / 60)}h {data.distance_duration_minutes % 60}m
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {distanceError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Distance Calculation Failed</strong>
            <p className="text-sm mt-1">{distanceError}</p>
          </AlertDescription>
        </Alert>
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-xs">A</span>
              </div>
              Pickup Location
            </div>
            <GooglePlacesAutocomplete
              label="Pickup Address"
              value={data.pickup_address}
              onChange={handlePickupChange}
              placeholder="Start typing your pickup address..."
              apiKey={apiKey}
              error={errors.pickup}
            />
            {data.pickup_city && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={data.pickup_city} disabled className="bg-gray-50 mt-1.5" />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input value={data.pickup_postal_code || 'N/A'} disabled className="bg-gray-50 mt-1.5" />
                </div>
              </div>
            )}

            {/* Pickup Access Details */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <p className="text-sm font-medium">Access Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">B</span>
              </div>
              Dropoff Location
            </div>
            <GooglePlacesAutocomplete
              label="Dropoff Address"
              value={data.dropoff_address}
              onChange={handleDropoffChange}
              placeholder="Start typing your dropoff address..."
              apiKey={apiKey}
              error={errors.dropoff}
            />
            {data.dropoff_city && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={data.dropoff_city} disabled className="bg-gray-50 mt-1.5" />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input value={data.dropoff_postal_code || 'N/A'} disabled className="bg-gray-50 mt-1.5" />
                </div>
              </div>
            )}

            {/* Dropoff Access Details */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <p className="text-sm font-medium">Access Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="move_date">Move Date <span className="text-gray-400 font-normal text-xs ml-1">(min. 1 week from today)</span></Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="date_flexible"
                  checked={data.date_flexible || false}
                  onCheckedChange={(v) => {
                    handleChange('date_flexible', v);
                    if (v) handleChange('move_date', '');
                  }}
                />
                <Label htmlFor="date_flexible" className="cursor-pointer text-sm font-normal">Flexible date</Label>
              </div>
            </div>
            {data.date_flexible ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                ✓ Your date is flexible — suppliers will contact you to agree on a suitable date.
              </div>
            ) : (
              <Input
                id="move_date"
                type="date"
                value={data.move_date || ''}
                min={minDate}
                onChange={(e) => handleChange('move_date', e.target.value)}
                className="max-w-xs"
              />
            )}
            {errors.move_date && <p className="text-sm text-red-500">{errors.move_date}</p>}
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
          <p className="text-sm text-gray-500">
            These requirements will be reviewed by the moving company and may affect pricing.
          </p>

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
          disabled={!canContinue || calculatingDistance}
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