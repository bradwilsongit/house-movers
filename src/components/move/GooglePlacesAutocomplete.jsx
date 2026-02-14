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
    // Reset state when apiKey changes
    if (!apiKey) {
      console.log('[GooglePlaces] No API key provided to', label);
      setScriptError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    // If we previously had no key but now have one, reset initAttempted
    if (apiKey && scriptError === 'Google Maps API key not configured') {
      console.log('[GooglePlaces] API key now available for', label, '- resetting state');
      initAttempted.current = false;
      setScriptError(null);
      setLoading(true);
    }

    if (initAttempted.current) {
      console.log('[GooglePlaces] Already attempted init for', label);
      return;
    }

    // Wait for container to be ready
    if (!containerRef.current) {
      console.log('[GooglePlaces] Container not ready for', label, '- will retry');
      const timer = setTimeout(() => {
        if (containerRef.current && !initAttempted.current && apiKey) {
          console.log('[GooglePlaces] Container now ready, initializing', label);
          initializeAutocomplete();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    console.log('[GooglePlaces] Container ready, initializing', label);
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

  const handlePlaceChange = async (event) => {
    console.log('[GooglePlaces] gmp-placeselect event fired for', label);
    console.log('[GooglePlaces] Event detail:', event.detail);
    
    const place = event.detail?.place;
    
    if (!place) {
      console.error('[GooglePlaces] No place in event detail');
      return;
    }

    console.log('[GooglePlaces] Place object:', place);
    console.log('[GooglePlaces] Place properties:', {
      id: place.id,
      displayName: place.displayName,
      formattedAddress: place.formattedAddress,
      hasLocation: !!place.location,
      addressComponents: place.addressComponents
    });

    // PlaceAutocompleteElement might need to fetch additional details
    if (!place.location && place.fetchFields) {
      console.log('[GooglePlaces] Fetching additional place fields...');
      try {
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'addressComponents', 'displayName']
        });
      } catch (e) {
        console.error('[GooglePlaces] Failed to fetch additional fields:', e);
      }
    }

    if (!place.location) {
      console.error('[GooglePlaces] Place has no location data');
      return;
    }

    // Extract address components
    const addressComponents = {};
    if (place.addressComponents) {
      place.addressComponents.forEach(component => {
        const types = component.types || [];
        if (types.includes('locality')) {
          addressComponents.city = component.longText || component.shortText;
        }
        if (types.includes('postal_code')) {
          addressComponents.postal_code = component.longText || component.shortText;
        }
      });
    }

    const placeData = {
      address: place.formattedAddress || place.displayName,
      place_id: place.id,
      lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
      lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng,
      city: addressComponents.city || '',
      postal_code: addressComponents.postal_code || ''
    };

    console.log('[GooglePlaces] ✓ Parsed place data for', label, ':', placeData);
    onChange(placeData);
  };

  const initializeAutocomplete = async () => {
    if (initAttempted.current) {
      console.log('[GooglePlaces] Init already attempted for', label);
      return;
    }

    initAttempted.current = true;
    console.log('[GooglePlaces] === Starting initialization for', label, '===');

    try {
      if (!containerRef.current) {
        console.error('[GooglePlaces] Container ref is null for', label);
        throw new Error('Container not ready - DOM element missing');
      }

      console.log('[GooglePlaces] Container ref OK, loading Google Maps API...');
      console.log('[GooglePlaces] API Key:', apiKey?.substring(0, 10) + '...' + apiKey?.slice(-4));
      
      const { PlaceAutocompleteElement } = await loadGoogleMapsAPI(apiKey);
      
      if (!PlaceAutocompleteElement) {
        throw new Error('PlaceAutocompleteElement not available after library load');
      }

      console.log('[GooglePlaces] PlaceAutocompleteElement available, creating widget for', label);

      // Create the new Places widget
      const autocomplete = new PlaceAutocompleteElement({
        componentRestrictions: { country: 'za' }
      });

      autocomplete.id = `place-autocomplete-${label.replace(/\s+/g, '-').toLowerCase()}`;
      autocomplete.style.width = '100%';
      
      // Clear and append
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(autocomplete);
      
      // Store reference
      autocompleteRef.current = autocomplete;
      
      // Listen for place selection - capture the event
      autocomplete.addEventListener('gmp-placeselect', async (event) => {
        console.log('[GooglePlaces] ✓ gmp-placeselect event fired for', label);
        await handlePlaceChange(event);
      });
      
      console.log('[GooglePlaces] ✓ Widget initialized successfully for', label);
      console.log('[GooglePlaces] Event listener attached, element ID:', autocomplete.id);
      setLoading(false);
      setScriptError(null);
    } catch (error) {
      console.error('[GooglePlaces] ✗ Initialization failed for', label, ':', error);
      console.error('[GooglePlaces] Error stack:', error.stack);
      setScriptError(error.message || 'Failed to load address autocomplete');
      setLoading(false);
      initAttempted.current = false; // Allow retry
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