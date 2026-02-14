// Singleton loader for Google Maps API using new importLibrary approach
let isLoading = false;
let isLoaded = false;
let loadPromise = null;
let placesLibrary = null;

export const loadGoogleMapsAPI = async (apiKey) => {
  // If already loaded, return the places library
  if (isLoaded && placesLibrary) {
    return placesLibrary;
  }

  // If currently loading, wait for existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Check if script already loaded
  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  
  if (!existingScript) {
    // Load the base script (only once)
    isLoading = true;
    
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = async () => {
        try {
          console.log('[GoogleMaps] Base script loaded, importing Places library...');
          // Import the Places library using new approach
          const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
          placesLibrary = { PlaceAutocompleteElement };
          isLoaded = true;
          isLoading = false;
          console.log('[GoogleMaps] Places library loaded successfully');
          resolve(placesLibrary);
        } catch (error) {
          isLoading = false;
          console.error('[GoogleMaps] Failed to import Places library:', error);
          reject(new Error('Failed to import Places library - ensure Places API is enabled'));
        }
      };

      script.onerror = () => {
        isLoading = false;
        console.error('[GoogleMaps] Script load failed');
        reject(new Error('Failed to load Google Maps - check API key and billing'));
      };

      document.head.appendChild(script);
    });

    return loadPromise;
  } else {
    // Script already exists, just import the library
    if (window.google?.maps?.importLibrary) {
      try {
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
        placesLibrary = { PlaceAutocompleteElement };
        isLoaded = true;
        return placesLibrary;
      } catch (error) {
        throw new Error('Failed to import Places library - ensure Places API is enabled');
      }
    } else {
      throw new Error('Google Maps API not properly initialized');
    }
  }
};