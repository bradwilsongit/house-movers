import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { Truck, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = L.divIcon({
  className: '',
  html: `<div style="background:#000;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="2"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function LiveTrackingMap({ bookingId, bookingStatus }) {
  const [driverLocation, setDriverLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const isLiveStatus = ['on_route'].includes(bookingStatus);
  const showMap = ['on_route', 'arrived'].includes(bookingStatus);

  const fetchLocation = async () => {
    try {
      const locations = await base44.entities.DriverLocation.filter({ booking_id: bookingId });
      if (locations.length > 0 && locations[0].is_active) {
        setDriverLocation(locations[0]);
        setIsTracking(true);
      } else {
        setIsTracking(false);
        if (locations.length > 0 && !locations[0].is_active) {
          setDriverLocation(null);
        }
      }
    } catch (e) {
      console.error('Error fetching driver location:', e);
    }
  };

  useEffect(() => {
    if (!showMap) return;

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [bookingId, bookingStatus]);

  if (!showMap) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">Live Driver Tracking</span>
        </div>
        <div className="flex items-center gap-2">
          {isLiveStatus && isTracking ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-sm text-gray-400">
              {bookingStatus === 'arrived' ? 'Driver has arrived' : 'Waiting for driver...'}
            </span>
          )}
        </div>
      </div>

      {driverLocation ? (
        <MapContainer
          center={[driverLocation.latitude, driverLocation.longitude]}
          zoom={14}
          style={{ height: '300px', width: '100%' }}
          key={`${driverLocation.latitude}-${driverLocation.longitude}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={truckIcon}>
            <Popup>Your driver is here!</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="h-[300px] bg-gray-50 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Navigation className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {bookingStatus === 'on_route' 
              ? 'Waiting for driver to share location...' 
              : 'Driver location not available'}
          </p>
        </div>
      )}
    </div>
  );
}