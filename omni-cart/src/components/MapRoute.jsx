import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '0.5rem'
};

function MapRoute({ targetStore }) {
  const [userLoc, setUserLoc] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  // 1. Load the Google Maps JS API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY" // Replace with your actual key
  });

  // 2. Request HTML5 Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.error("Geolocation Error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // 3. Calculate Route using Directions API
  useEffect(() => {
    if (isLoaded && userLoc && targetStore?.location) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: userLoc,
          destination: targetStore.location,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            setDistance(result.routes[0].legs[0].distance.text);
            setDuration(result.routes[0].legs[0].duration.text);
          } else {
            console.error(`Directions request failed: ${status}`);
          }
        }
      );
    }
  }, [isLoaded, userLoc, targetStore]);

  if (!isLoaded) {
    return <div className="animate-pulse bg-slate-800 h-[250px] w-full rounded flex items-center justify-center text-slate-400">Loading Map Engine...</div>;
  }

  if (!userLoc) {
    return <div className="animate-pulse bg-slate-800 h-[250px] w-full rounded flex items-center justify-center text-amber-400">Requesting GPS Location...</div>;
  }

  return (
    <div className="flex flex-col space-y-3 mt-4 bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-xl">
      {/* UI Header Data */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-emerald-400 font-bold tracking-wide">{targetStore.name}</span>
        <span className="text-slate-300 font-mono bg-slate-800 px-2 py-1 rounded">
          {distance} • {duration}
        </span>
      </div>
      
      {/* Map Canvas */}
      <div className="border border-slate-600 rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLoc}
          zoom={12}
          options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
        >
          {directions && (
            <DirectionsRenderer 
              directions={directions} 
              options={{ suppressMarkers: false }} 
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default MapRoute;