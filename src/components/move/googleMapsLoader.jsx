// Singleton loader for Google Maps API using new importLibrary approach
let isLoading = false;
let isLoaded = false;
let loadPromise = null;
let placesLibrary = null;

export const loadGoogleMapsAPI = async (apiKey) => {
  console.log('[GoogleMapsLoader] Called with key:', apiKey?.substring(0, 10) + '...');

  // If already loaded, return the places library
  if (isLoaded && placesLibrary) {
    console.log('[GoogleMapsLoader] Already loaded, returning cached library');
    return placesLibrary;
  }

  // If currently loading, wait for existing promise
  if (isLoading && loadPromise) {
    console.log('[GoogleMapsLoader] Load in progress, waiting for existing promise');
    return loadPromise;
  }

  // Check if script already loaded
  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  console.log('[GoogleMapsLoader] Existing script found:', !!existingScript);
  
  if (!existingScript) {
    // Load the base script (only once)
    console.log('[GoogleMapsLoader] Loading Google Maps base script...');
    isLoading = true;
    
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;

      console.log('[GoogleMapsLoader] Creating script element:', scriptSrc);

      script.onload = async () => {
        console.log('[GoogleMapsLoader] ✓ Base script loaded successfully');
        try {
          console.log('[GoogleMapsLoader] Importing Places library via importLibrary...');
          
          if (!window.google?.maps?.importLibrary) {
            throw new Error('google.maps.importLibrary not available - script loaded but API not initialized');
          }

          const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
          
          if (!PlaceAutocompleteElement) {
            throw new Error('PlaceAutocompleteElement not exported from Places library');
          }

          placesLibrary = { PlaceAutocompleteElement };
          isLoaded = true;
          isLoading = false;
          console.log('[GoogleMapsLoader] ✓ Places library imported successfully');
          resolve(placesLibrary);
        } catch (error) {
          isLoading = false;
          console.error('[GoogleMapsLoader] ✗ Failed to import Places library:', error);
          console.error('[GoogleMapsLoader] Error details:', error.message, error.stack);
          reject(new Error(`Places library import failed: ${error.message}. Ensure Places API is enabled in Google Cloud Console.`));
        }
      };

      script.onerror = (error) => {
        isLoading = false;
        console.error('[GoogleMapsLoader] ✗ Script load failed:', error);
        reject(new Error('Failed to load Google Maps script - check API key, billing, and network connection'));
      };

      console.log('[GoogleMapsLoader] Appending script to document head...');
      document.head.appendChild(script);
      console.log('[GoogleMapsLoader] Script element added, waiting for load event...');
    });

    return loadPromise;
  } else {
    // Script already exists, just import the library
    console.log('[GoogleMapsLoader] Script already exists, importing library...');
    if (window.google?.maps?.importLibrary) {
      try {
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
        placesLibrary = { PlaceAutocompleteElement };
        isLoaded = true;
        console.log('[GoogleMapsLoader] ✓ Places library imported (script pre-existing)');
        return placesLibrary;
      } catch (error) {
        console.error('[GoogleMapsLoader] ✗ Failed to import with existing script:', error);
        throw new Error('Failed to import Places library - ensure Places API is enabled');
      }
    } else {
      console.error('[GoogleMapsLoader] ✗ window.google.maps.importLibrary not available');
      throw new Error('Google Maps API not properly initialized');
    }
  }
};