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
  const listenerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scriptError, setScriptError] = useState(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    // Distinguish between loading (null) and misconfigured (undefined/empty string)
    if (apiKey === null) {
      console.log('[GooglePlaces] API key still loading for', label);
      setLoading(true);
      setScriptError(null);
      return;
    }
    
    if (apiKey === undefined || apiKey === '') {
      console.log('[GooglePlaces] No API key configured for', label);
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
      // Cleanup listener and element
      console.log('[GooglePlaces] Cleaning up', label);
      if (listenerRef.current && autocompleteRef.current) {
        try {
          autocompleteRef.current.removeEventListener('gmp-placeselect', listenerRef.current);
          console.log('[GooglePlaces] ✓ Event listener removed');
        } catch (e) {
          console.error('[GooglePlaces] Listener cleanup error:', e);
        }
      }
      if (containerRef.current) {
        try {
          containerRef.current.innerHTML = '';
          console.log('[GooglePlaces] ✓ Container cleared');
        } catch (e) {
          console.error('[GooglePlaces] Container cleanup error:', e);
        }
      }
      autocompleteRef.current = null;
      listenerRef.current = null;
    };
  }, [apiKey]);

  const handlePlaceChange = async (event) => {
    console.log('[GooglePlaces] gmp-placeselect fired for', label, event);
    
    const place = event.place;
    if (!place) {
      console.warn('[GooglePlaces] placeselect fired but event.place missing', event);
      return;
    }

    console.log('[GooglePlaces] Place object received:', place);

    try {
      await place.fetchFields({
        fields: ['id', 'formattedAddress', 'location', 'addressComponents']
      });
      console.log('[GooglePlaces] ✓ Fields fetched successfully');
    } catch (e) {
      console.error('[GooglePlaces] ✗ Failed to fetch fields:', e);
      return;
    }

    // Extract address components
    let city = '';
    let postal_code = '';
    if (place.addressComponents) {
      place.addressComponents.forEach(component => {
        const types = component.types || [];
        if (types.includes('locality')) {
          city = component.longText || component.shortText;
        }
        if (types.includes('postal_code')) {
          postal_code = component.longText || component.shortText;
        }
      });
    }

    const payload = {
      address: place.formattedAddress || '',
      place_id: place.id || null,
      lat: place.location?.lat?.() ?? null,
      lng: place.location?.lng?.() ?? null,
      city: city,
      postal_code: postal_code
    };

    console.log('[GooglePlaces] → Calling parent onChange with:', payload);
    onChange(payload);
    console.log('[GooglePlaces] ✓ Parent onChange called for', label);
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
      
      // Listen for place selection and store listener ref for cleanup
      listenerRef.current = handlePlaceChange;
      autocomplete.addEventListener('gmp-placeselect', handlePlaceChange);
      
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