import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadGoogleMapsAPI } from './googleMapsLoader';

export default function GooglePlacesAutocomplete({ 
  label, 
  value, 
  onChange, 
  placeholder,
  apiKey,
  error 
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scriptError, setScriptError] = useState(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (!apiKey) {
      setScriptError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    // Wait for input to be mounted
    if (!inputRef.current) {
      console.log('[GooglePlaces] Input ref not ready, waiting...');
      const timer = setTimeout(() => {
        if (inputRef.current && !initAttempted.current) {
          initializeAutocomplete();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    if (!initAttempted.current) {
      initializeAutocomplete();
    }
  }, [apiKey, inputRef.current]);

  const initializeAutocomplete = async () => {
    if (initAttempted.current) {
      console.log('[GooglePlaces] Already attempted initialization');
      return;
    }

    initAttempted.current = true;

    try {
      console.log('[GooglePlaces] Starting initialization for', label);
      
      if (!inputRef.current) {
        console.error('[GooglePlaces] Input ref is null for', label);
        throw new Error('Input element not available - DOM not ready');
      }

      console.log('[GooglePlaces] Input element found, loading Google Maps API...');
      
      await loadGoogleMapsAPI(apiKey);
      
      console.log('[GooglePlaces] Script loaded, checking Places availability...');
      
      if (!window.google?.maps?.places?.Autocomplete) {
        const errorMsg = !window.google 
          ? 'Google Maps not loaded'
          : !window.google.maps 
          ? 'Google Maps API not initialized'
          : 'Places library not loaded - ensure Places API is enabled in Google Cloud Console';
        
        console.error('[GooglePlaces] Error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[GooglePlaces] Initializing Autocomplete for', label);

      // Initialize autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'za' },
          fields: ['place_id', 'formatted_address', 'address_components', 'geometry'],
          types: ['address']
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      
      console.log('[GooglePlaces] Autocomplete initialized successfully for', label);
      setLoading(false);
      setScriptError(null);
    } catch (error) {
      console.error('[GooglePlaces] Initialization error for', label, ':', error);
      setScriptError(error.message || 'Failed to initialize address autocomplete');
      setLoading(false);
      initAttempted.current = false; // Allow retry
    }
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (!place.place_id) {
      console.error('No place selected or invalid selection');
      return;
    }

    // Extract address components
    let city = '';
    let postal_code = '';

    place.address_components?.forEach(component => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        postal_code = component.long_name;
      }
    });

    // Pass complete place data to parent
    onChange({
      address: place.formatted_address,
      city: city,
      postal_code: postal_code,
      place_id: place.place_id,
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
    });
  };

  if (scriptError) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 text-sm">
            {scriptError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleInputMount = (element) => {
    if (element && !inputRef.current) {
      console.log('[GooglePlaces] Input mounted for', label);
      inputRef.current = element;
      if (apiKey && !initAttempted.current) {
        initializeAutocomplete();
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={handleInputMount}
          type="text"
          placeholder={placeholder}
          defaultValue={value}
          disabled={loading}
          className={`pl-10 ${error ? 'border-red-500' : ''}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {!loading && !error && (
        <p className="text-xs text-gray-500">
          Start typing and select from the dropdown
        </p>
      )}
    </div>
  );
}