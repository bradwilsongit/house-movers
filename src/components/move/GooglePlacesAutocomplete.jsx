import React, { useRef, useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [inputValue, setInputValue] = useState(value || '');
  const initAttempted = useRef(false);

  // Global debug listeners (run once)
  useEffect(() => {
    if (!window.__gmpPlaceselectDebug) {
      window.__gmpPlaceselectDebug = true;
      
      document.addEventListener(
        "gmp-placeselect",
        (e) => console.log("[GLOBAL] ✅ gmp-placeselect captured", e),
        true
      );
      
      window.addEventListener(
        "gmp-placeselect",
        (e) => console.log("[WINDOW] ✅ gmp-placeselect captured", e),
        true
      );
      
      console.log('[GooglePlaces] Global debug listeners installed');
    }
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  useEffect(() => {
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

    if (!inputRef.current) {
      console.log('[GooglePlaces] Input ref not ready for', label);
      return;
    }

    console.log('[GooglePlaces] Input ready, initializing classic Autocomplete for', label);
    initializeAutocomplete();

    return () => {
      console.log('[GooglePlaces] Cleaning up', label);
      if (autocompleteRef.current) {
        try {
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
          console.log('[GooglePlaces] ✓ Listeners cleared');
        } catch (e) {
          console.error('[GooglePlaces] Cleanup error:', e);
        }
      }
      autocompleteRef.current = null;
    };
  }, [apiKey]);

  const handlePlaceChange = () => {
    const place = autocompleteRef.current.getPlace();
    console.log('[GooglePlaces] ✅ place_changed fired for', label, ':', place);

    if (!place?.place_id) {
      console.warn('[GooglePlaces] No place_id in selected place');
      return;
    }

    // Extract address components
    let city = '';
    let postal_code = '';
    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types || [];
        if (types.includes('locality')) {
          city = component.long_name || component.short_name;
        }
        if (types.includes('postal_code')) {
          postal_code = component.long_name || component.short_name;
        }
      });
    }

    const payload = {
      address: place.formatted_address || '',
      place_id: place.place_id,
      lat: place.geometry?.location?.lat?.() ?? null,
      lng: place.geometry?.location?.lng?.() ?? null,
      city: city,
      postal_code: postal_code
    };

    console.log('[GooglePlaces] ✅ calling parent onChange(payload):', payload);
    setInputValue(payload.address);
    onChange(payload);
  };

  const initializeAutocomplete = async () => {
    if (initAttempted.current) {
      console.log('[GooglePlaces] Init already attempted for', label);
      return;
    }

    initAttempted.current = true;
    console.log('[GooglePlaces] === Starting classic Autocomplete initialization for', label, '===');

    try {
      if (!inputRef.current) {
        console.error('[GooglePlaces] Input ref is null for', label);
        throw new Error('Input element not ready');
      }

      console.log('[GooglePlaces] Loading Google Maps API...');
      
      // Load Google Maps JavaScript API and wait for places library
      await new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        
        const waitForPlaces = () => {
          const checkInterval = setInterval(() => {
            if (window.google?.maps?.places?.Autocomplete) {
              clearInterval(checkInterval);
              console.log('[GooglePlaces] ✓ Places library confirmed available');
              resolve();
            }
          }, 50);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.google?.maps?.places?.Autocomplete) {
              reject(new Error('Google Maps Places library load timeout'));
            }
          }, 10000);
        };

        if (existingScript) {
          console.log('[GooglePlaces] Script already exists, waiting for places library...');
          if (window.google?.maps?.places?.Autocomplete) {
            console.log('[GooglePlaces] Places already loaded');
            resolve();
          } else {
            waitForPlaces();
          }
          return;
        }

        console.log('[GooglePlaces] Creating new script tag');
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('[GooglePlaces] Script loaded, waiting for places library...');
          waitForPlaces();
        };
        script.onerror = () => reject(new Error('Failed to load Google Maps API'));
        document.head.appendChild(script);
      });

      console.log('[GooglePlaces] Google Maps API and Places library ready, creating Autocomplete for', label);

      // Create classic Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'za' },
        fields: ['place_id', 'formatted_address', 'address_components', 'geometry'],
        types: ['address']
      });

      autocompleteRef.current = autocomplete;

      // Listen for place_changed event
      autocomplete.addListener('place_changed', handlePlaceChange);

      console.log('[GooglePlaces] ✓ Classic Autocomplete initialized for', label);
      
      setLoading(false);
      setScriptError(null);
    } catch (error) {
      console.error('[GooglePlaces] ✗ Initialization failed for', label, ':', error);
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
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder || 'Start typing address...'}
          className="pl-10"
          disabled={loading || !!scriptError}
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