import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Sparkles, Loader2, CheckCircle2, ExternalLink, Trash2, Globe, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

function slugify(text) {
  return text.toLowerCase().replace(/[\s,]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').trim('-');
}

export default function LocationPageGenerator({ apiKey }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (!apiKey || initRef.current) return;
    initRef.current = true;
    initAutocomplete();
  }, [apiKey]);

  const initAutocomplete = async () => {
    // Use same pattern as GooglePlacesAutocomplete component
    await new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');

      const waitForPlaces = () => {
        const check = setInterval(() => {
          if (window.google?.maps?.places?.Autocomplete) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => { clearInterval(check); if (!window.google?.maps?.places?.Autocomplete) reject(new Error('timeout')); }, 10000);
      };

      if (existingScript) {
        if (window.google?.maps?.places?.Autocomplete) resolve();
        else waitForPlaces();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = waitForPlaces;
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });

    if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'za' },
      fields: ['place_id', 'formatted_address', 'address_components', 'geometry', 'name'],
      types: ['(regions)']
    });

    autocompleteRef.current = ac;

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place?.place_id) return;

      let city = '', province = '', locationName = '';

      if (place.address_components) {
        place.address_components.forEach(c => {
          const types = c.types || [];
          if (types.includes('locality') || types.includes('sublocality_level_1') || types.includes('sublocality')) {
            if (!locationName) locationName = c.long_name;
          }
          if (types.includes('administrative_area_level_2') || types.includes('locality')) {
            if (!city) city = c.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            province = c.long_name;
          }
        });
      }

      if (!locationName) locationName = place.name || place.formatted_address?.split(',')[0];
      if (!city) city = locationName;

      setSelectedPlace({
        location_name: locationName,
        city,
        province,
        lat: place.geometry?.location?.lat?.(),
        lng: place.geometry?.location?.lng?.(),
        place_id: place.place_id,
        slug: slugify(locationName)
      });
      setInputValue(locationName);
    });
  };

  const loadPages = async () => {
    try {
      const data = await base44.entities.LocationPage.list('-created_date', 50);
      setPages(data);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPlace) {
      setError('Please select a location from the dropdown');
      return;
    }
    setError('');
    setGenerating(true);

    try {
      // Check for duplicate slug
      const existing = pages.find(p => p.slug === selectedPlace.slug);

      // Create or get the record to update
      let record;
      if (existing) {
        record = existing;
        await base44.entities.LocationPage.update(existing.id, { generation_status: 'generating' });
      } else {
        record = await base44.entities.LocationPage.create({
          ...selectedPlace,
          generation_status: 'generating',
          is_published: false
        });
      }

      // Call generation function
      const response = await base44.functions.invoke('generateLocationPage', {
        ...selectedPlace,
        apiKey
      });

      if (response.data?.success) {
        await base44.entities.LocationPage.update(record.id, response.data.pageData);
        setInputValue('');
        setSelectedPlace(null);
        await loadPages();
      } else {
        await base44.entities.LocationPage.update(record.id, { generation_status: 'error' });
        setError(response.data?.error || 'Generation failed');
      }
    } catch (e) {
      setError(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.LocationPage.delete(id);
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const togglePublished = async (page) => {
    await base44.entities.LocationPage.update(page.id, { is_published: !page.is_published });
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: !p.is_published } : p));
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location (suburb or city)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setSelectedPlace(null); }}
                    placeholder="e.g. Sandton, Waterfall, Cape Town..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !selectedPlace}
                  className="bg-black text-white hover:bg-gray-800 shrink-0"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate Page</>
                  )}
                </Button>
              </div>
              {selectedPlace && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {selectedPlace.location_name}{selectedPlace.city && selectedPlace.city !== selectedPlace.location_name ? `, ${selectedPlace.city}` : ''}{selectedPlace.province ? ` · ${selectedPlace.province}` : ''} · slug: /location/{selectedPlace.slug}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{error}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Generated Pages ({pages.length})
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-xl">
            No location pages yet. Generate your first one above.
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map(page => (
              <div key={page.id} className="flex items-center gap-4 p-4 bg-white border rounded-xl hover:border-gray-300 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{page.location_name}</span>
                    {page.generation_status === 'generating' && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-700">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating
                      </Badge>
                    )}
                    {page.generation_status === 'error' && (
                      <Badge className="text-xs bg-red-100 text-red-700">Error</Badge>
                    )}
                    {page.generation_status === 'complete' && (
                      <Badge className={`text-xs ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">/location/{page.slug}</p>
                  {page.seo_title && <p className="text-xs text-gray-500 truncate mt-0.5">{page.seo_title}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {page.generation_status === 'complete' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => togglePublished(page)}
                      >
                        <Globe className="w-3.5 h-3.5 mr-1" />
                        {page.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <a
                        href={`/location/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />View
                        </Button>
                      </a>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(page.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}