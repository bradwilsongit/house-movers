import React, { useRef, useEffect, useState } from 'react';
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
  const containerRef = useRef(null);
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

    if (!containerRef.current || initAttempted.current) {
      return;
    }

    initializeAutocomplete();

    return () => {
      // Cleanup
      if (autocompleteRef.current && containerRef.current) {
        try {
          containerRef.current.innerHTML = '';
        } catch (e) {
          console.error('[GooglePlaces] Cleanup error:', e);
        }
      }
    };
  }, [apiKey]);

  const handlePlaceChange = (event) => {
    const place = event.detail.place;
    
    console.log('[GooglePlaces] Place selected:', place);

    if (!place || !place.location) {
      console.error('[GooglePlaces] Invalid place data');
      return;
    }

    // Extract address components
    const addressComponents = {};
    place.addressComponents?.forEach(component => {
      const types = component.types || [];
      if (types.includes('locality')) {
        addressComponents.city = component.longText || component.shortText;
      }
      if (types.includes('postal_code')) {
        addressComponents.postal_code = component.longText || component.shortText;
      }
    });

    const placeData = {
      address: place.formattedAddress || place.displayName,
      place_id: place.id,
      lat: place.location.lat(),
      lng: place.location.lng(),
      city: addressComponents.city || '',
      postal_code: addressComponents.postal_code || ''
    };

    console.log('[GooglePlaces] Parsed place data:', placeData);
    onChange(placeData);
  };

  const initializeAutocomplete = async () => {
    if (initAttempted.current) {
      return;
    }

    initAttempted.current = true;

    try {
      console.log('[GooglePlaces] Initializing widget for', label);
      
      if (!containerRef.current) {
        throw new Error('Container not ready');
      }

      const { PlaceAutocompleteElement } = await loadGoogleMapsAPI(apiKey);
      
      console.log('[GooglePlaces] Creating PlaceAutocompleteElement...');

      // Create the new Places widget
      const autocomplete = new PlaceAutocompleteElement({
        componentRestrictions: { country: 'za' },
        fields: ['id', 'displayName', 'formattedAddress', 'addressComponents', 'location']
      });

      autocomplete.id = `place-autocomplete-${label.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Style the widget to match our design
      autocomplete.style.width = '100%';
      
      // Clear container and append widget
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(autocomplete);
      
      // Listen for place selection
      autocomplete.addEventListener('gmp-placeselect', handlePlaceChange);
      
      autocompleteRef.current = autocomplete;
      
      console.log('[GooglePlaces] Widget initialized successfully for', label);
      setLoading(false);
      setScriptError(null);
    } catch (error) {
      console.error('[GooglePlaces] Initialization error for', label, ':', error);
      setScriptError(error.message || 'Failed to load address autocomplete');
      setLoading(false);
      initAttempted.current = false;
    }
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

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-3 z-10 pointer-events-none">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
        <div 
          ref={containerRef}
          className="relative [&_input]:pl-10 [&_input]:h-9 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-gray-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:placeholder:text-gray-500 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-1 [&_input]:focus-visible:ring-gray-400"
        />
        {loading && (
          <div className="absolute right-3 top-3 z-10">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {!loading && !error && !scriptError && (
        <p className="text-xs text-gray-500">
          Start typing and select from the dropdown
        </p>
      )}
    </div>
  );
}