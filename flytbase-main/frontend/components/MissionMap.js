'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Next.js - ONLY RUN ON CLIENT
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export default function MissionMap({ onAreaSelected }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const markersRef = useRef([]);
  const pointsRef = useRef([]);
  const callbackRef = useRef(onAreaSelected);
  const [points, setPoints] = useState([]);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onAreaSelected;
  }, [onAreaSelected]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map only once
    const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Apply a tactical dark filter to the tiles specifically via container class
    map.getContainer().classList.add('tactical-map');

    mapInstanceRef.current = map;

    // Handle map clicks to create polygon
    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      pointsRef.current.push({ lat, lng });
      const newPoints = [...pointsRef.current];
      setPoints(newPoints);

      // Add marker
      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        color: '#60A5FA', // Primary-400
        fillColor: '#60A5FA',
        fillOpacity: 0.8,
        weight: 1
      }).addTo(map);

      marker.bindPopup(`Point ${newPoints.length}`).openPopup();
      markersRef.current.push(marker);

      // Update or create polygon
      if (newPoints.length >= 3) {
        // Remove existing polygon
        if (polygonRef.current) {
          map.removeLayer(polygonRef.current);
        }

        // Create new polygon
        const polygon = L.polygon(newPoints.map(p => [p.lat, p.lng]), {
          color: '#60A5FA', // High visibility blue
          fillColor: '#60A5FA',
          fillOpacity: 0.3,
          weight: 3,
          dashArray: '8, 8',
          interactive: false
        }).addTo(map);

        // Add a secondary glow polygon (optional but cool)
        const glow = L.polygon(newPoints.map(p => [p.lat, p.lng]), {
          color: '#3B82F6',
          weight: 10,
          opacity: 0.1,
          fillColor: 'transparent',
          interactive: false
        }).addTo(map);

        polygonRef.current = L.layerGroup([polygon, glow]).addTo(map);

        // Calculate bounds
        const bounds = {
          minLat: Math.min(...newPoints.map(p => p.lat)),
          maxLat: Math.max(...newPoints.map(p => p.lat)),
          minLng: Math.min(...newPoints.map(p => p.lng)),
          maxLng: Math.max(...newPoints.map(p => p.lng)),
        };

        // Notify parent via ref
        if (callbackRef.current) {
          callbackRef.current({
            coordinates: newPoints,
            bounds,
          });
        }
      }
    };

    map.on('click', handleMapClick);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only init once

  const removeLastPoint = () => {
    if (pointsRef.current.length === 0) return;

    // Remove last marker
    const lastMarker = markersRef.current.pop();
    if (lastMarker) {
      mapInstanceRef.current.removeLayer(lastMarker);
    }

    // Update points
    pointsRef.current.pop();
    const newPoints = [...pointsRef.current];
    setPoints(newPoints);

    // Update or remove polygon
    if (polygonRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (newPoints.length >= 3) {
      const polygon = L.polygon(newPoints.map(p => [p.lat, p.lng]), {
        color: '#60A5FA',
        fillColor: '#60A5FA',
        fillOpacity: 0.3,
        weight: 3,
        dashArray: '8, 8',
        interactive: false
      }).addTo(mapInstanceRef.current);

      const glow = L.polygon(newPoints.map(p => [p.lat, p.lng]), {
        color: '#3B82F6',
        weight: 10,
        opacity: 0.1,
        fillColor: 'transparent',
        interactive: false
      }).addTo(mapInstanceRef.current);

      polygonRef.current = L.layerGroup([polygon, glow]).addTo(mapInstanceRef.current);

      const bounds = {
        minLat: Math.min(...newPoints.map(p => p.lat)),
        maxLat: Math.max(...newPoints.map(p => p.lat)),
        minLng: Math.min(...newPoints.map(p => p.lng)),
        maxLng: Math.max(...newPoints.map(p => p.lng)),
      };

      if (callbackRef.current) {
        callbackRef.current({ coordinates: newPoints, bounds });
      }
    } else {
      if (callbackRef.current) {
        callbackRef.current(null);
      }
    }
  };

  const clearSelection = () => {
    if (!mapInstanceRef.current) return;

    // Remove all markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Remove polygon
    if (polygonRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    pointsRef.current = [];
    setPoints([]);

    if (callbackRef.current) {
      callbackRef.current(null);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', zIndex: 1, background: '#111' }}
      />
      {points.length > 0 && (
        <div className="glass-panel absolute top-4 right-4 z-[1000] p-4 rounded-lg border border-white/10 backdrop-blur-md w-48">
          <div className="mb-2 text-sm font-semibold text-white flex justify-between items-center">
            <span>Vertices</span>
            <span className="text-primary-400 font-mono">{points.length}</span>
          </div>
          {points.length < 3 ? (
            <div className="text-[10px] text-gray-400 mb-3 uppercase tracking-wider">
              Need {3 - points.length} more to close
            </div>
          ) : (
            <div className="text-[10px] text-green-400 mb-3 uppercase tracking-wider font-bold">
              Area defined - Add more optionally
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={removeLastPoint}
              className="px-3 py-1.5 text-[10px] uppercase font-bold bg-white/5 text-gray-300 border border-white/10 rounded hover:bg-white/10 transition-colors w-full"
            >
              Undo Last
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors w-full"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
