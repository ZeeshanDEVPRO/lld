'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Ensure L is available for client-side side-effects
if (typeof window !== 'undefined') {
  // Global Leaflet fixes can go here
}

export default function LiveMissionMap({ mission }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const droneMarkerRef = useRef(null);
  const waypointLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !mission) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      map.getContainer().classList.add('tactical-map');

      mapInstanceRef.current = map;
      waypointLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Parse survey area polygon
    if (mission.survey_area_polygon) {
      const polygon = typeof mission.survey_area_polygon === 'string'
        ? JSON.parse(mission.survey_area_polygon)
        : mission.survey_area_polygon;

      if (polygon.coordinates && polygon.coordinates.length > 0) {
        // Clear existing waypoints
        waypointLayerRef.current.clearLayers();

        // Draw survey area
        const areaPolygon = L.polygon(
          polygon.coordinates.map(c => [c.lat, c.lng]),
          {
            color: '#3B82F6', // Neon Blue
            weight: 1,
            fillColor: '#3B82F6',
            fillOpacity: 0.1
          }
        ).addTo(waypointLayerRef.current);

        // Fit map to polygon
        map.fitBounds(areaPolygon.getBounds());
      }
    }

    // Draw waypoints
    if (mission.waypoints && mission.waypoints.length > 0) {
      mission.waypoints.forEach((wp, index) => {
        let color = '#4B5563'; // Gray for pending
        let radius = 4;

        if (wp.status === 'completed') {
          color = '#10B981'; // Emerald/Green from theme
        } else if (wp.status === 'in-progress') {
          color = '#F59E0B'; // Amber/Orange to highlight current
          radius = 6;
        }

        L.circleMarker([wp.latitude, wp.longitude], {
          radius: radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 1
        })
          .bindPopup(`Waypoint ${index + 1}: ${wp.status}`)
          .addTo(waypointLayerRef.current);
      });

      // Draw path
      const path = mission.waypoints
        .filter(wp => wp.status === 'completed' || wp.status === 'in-progress')
        .map(wp => [wp.latitude, wp.longitude]);

      if (path.length > 1) {
        L.polyline(path, { color: '#10B981', weight: 2 }).addTo(waypointLayerRef.current);
      }
    }

    // Update drone position
    const currentWaypoint = mission.waypoints?.find(wp => wp.status === 'in-progress');
    if (currentWaypoint) {
      if (droneMarkerRef.current) {
        map.removeLayer(droneMarkerRef.current);
      }

      const icon = L.divIcon({
        className: 'drone-marker',
        html: '<div style="font-size: 24px;">🚁</div>',
        iconSize: [30, 30],
      });

      droneMarkerRef.current = L.marker([currentWaypoint.latitude, currentWaypoint.longitude], { icon })
        .addTo(map);
    }
  }, [mission]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}

