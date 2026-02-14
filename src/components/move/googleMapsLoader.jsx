// Singleton loader for Google Maps API
let isLoading = false;
let isLoaded = false;
let loadPromise = null;

export const loadGoogleMapsAPI = (apiKey) => {
  // If already loaded and Places is available, return resolved promise
  if (isLoaded && window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Check if already loaded but we haven't set our flag
  if (window.google?.maps?.places?.Autocomplete) {
    isLoaded = true;
    return Promise.resolve();
  }

  // Start loading
  isLoading = true;
  
  loadPromise = new Promise((resolve, reject) => {
    // Remove any existing scripts to prevent duplicates
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => script.remove());

    // Create unique callback name
    const callbackName = 'initGoogleMaps_' + Date.now();
    
    window[callbackName] = () => {
      // Wait a bit for Places library to be fully available
      const checkPlaces = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          clearInterval(checkPlaces);
          isLoaded = true;
          isLoading = false;
          delete window[callbackName];
          resolve();
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkPlaces);
        if (!isLoaded) {
          isLoading = false;
          delete window[callbackName];
          reject(new Error('Places library failed to load - check API key has Places API enabled and billing is active'));
        }
      }, 5000);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      isLoading = false;
      delete window[callbackName];
      reject(new Error('Failed to load Google Maps script - check API key and network connection'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};