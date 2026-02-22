'use client';
import { useState, useEffect, useCallback } from 'react';
import { useLocationStore } from '@/stores/useLocationStore';
import { reverseGeocode } from '@/lib/api/geocoding';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation, setCurrentLocation, setLocationPermission } = useLocationStore();

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationPermission('granted');

        try {
          const geo = await reverseGeocode(latitude, longitude);
          const name = geo ? `${geo.city || 'Unknown'}, ${geo.state || ''}`.trim().replace(/,$/, '') : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setCurrentLocation({ lat: latitude, lon: longitude, name });
        } catch {
          setCurrentLocation({ lat: latitude, lon: longitude, name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` });
        }
        setLoading(false);
      },
      (err) => {
        setLocationPermission('denied');
        setError(err.message);
        setLoading(false);
        // Default to New York City
        setCurrentLocation({ lat: 40.7128, lon: -74.006, name: 'New York, NY' });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [setCurrentLocation, setLocationPermission]);

  useEffect(() => {
    if (!currentLocation) {
      requestLocation();
    }
  }, [currentLocation, requestLocation]);

  return { location: currentLocation, loading, error, requestLocation };
}
