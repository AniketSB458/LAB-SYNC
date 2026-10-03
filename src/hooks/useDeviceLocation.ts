import { useState, useEffect, useCallback, useRef } from 'react';
import { RouteNode } from '../types';

export interface DeviceLocationState {
  isSupported: boolean;
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  error: string | null;
  isSimulated: boolean;
}

// RIT Islampur Campus Reference Anchor Point
const CAMPUS_BASE_LAT = 17.0452;
const CAMPUS_BASE_LNG = 74.2654;

export function useDeviceLocation(nodes: RouteNode[] = []) {
  const [state, setState] = useState<DeviceLocationState>({
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    isTracking: false,
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    error: null,
    isSimulated: false,
  });

  const watchIdRef = useRef<number | null>(null);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Start real device tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        isTracking: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null, isSimulated: false }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          isSupported: true,
          isTracking: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 5),
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 10) / 10 : 1.2,
          heading: pos.coords.heading || 45,
          error: null,
          isSimulated: false,
        });
      },
      (err) => {
        // Fallback to high-fidelity campus simulation mode if user denies or GPS unavailable
        console.warn('Geolocation warning / fallback:', err.message);
        setState((prev) => ({
          ...prev,
          error: err.code === 1 ? 'Location permission denied. Switched to Campus GPS Simulation.' : null,
          isSimulated: true,
          latitude: CAMPUS_BASE_LAT,
          longitude: CAMPUS_BASE_LNG,
          accuracy: 4,
          speed: 1.4,
          heading: 90,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );
  }, []);

  const toggleTracking = useCallback(() => {
    if (state.isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Compute nearest campus node to device coordinates
  const nearestNode = useCallback((): RouteNode | null => {
    if (!nodes.length) return null;
    if (!state.latitude || !state.longitude) return nodes[0];

    // If simulated or within campus bounding delta, compute distance from campus anchor
    const latDiff = (state.latitude - CAMPUS_BASE_LAT) * 111000;
    const lngDiff = (state.longitude - CAMPUS_BASE_LNG) * 111000 * Math.cos((CAMPUS_BASE_LAT * Math.PI) / 180);

    // Approximate mapping to SVG canvas scale
    let bestDist = Infinity;
    let closestNode = nodes[0];

    nodes.forEach((n) => {
      // Map node x,y to relative distance from gate
      const dx = (n.x - 80) * 0.8;
      const dy = (n.y - 440) * 0.8;
      const dist = Math.hypot(dx - lngDiff, dy - latDiff);
      if (dist < bestDist) {
        bestDist = dist;
        closestNode = n;
      }
    });

    return closestNode;
  }, [nodes, state.latitude, state.longitude]);

  return {
    ...state,
    startTracking,
    stopTracking,
    toggleTracking,
    nearestNode,
  };
}
