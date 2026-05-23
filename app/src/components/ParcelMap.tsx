import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet default icon issues
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface ParcelDrawData {
  parcelId: string;
  geoJson: any;
  centroid: { lat: number; lng: number };
  area: number;
}

interface ParcelMapProps {
  onParcelDrawn: (data: ParcelDrawData | null) => void;
  initialGeoJson?: any;
  height?: string;
  className?: string;
}

const ParcelMap: React.FC<ParcelMapProps> = ({
  onParcelDrawn,
  initialGeoJson,
  height = "400px",
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    mapInstance.current = map;

    // Add tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add feature group for drawn items
    drawnItems.current.addTo(map);

    // If initial GeoJSON is provided, add it to the map
    if (initialGeoJson) {
      const geoLayer = L.geoJSON(initialGeoJson);
      geoLayer.eachLayer((layer: any) => {
        if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
          drawnItems.current.addLayer(layer);
        }
      });
      map.fitBounds(drawnItems.current.getBounds());
    }

    // Configure draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems.current,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Polygon edges cannot cross!'
          },
          shapeOptions: {
            color: '#10b981'
          }
        },
        // Disable other tools
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false
      }
    });

    map.addControl(drawControl);

    // Helper tooltip
    const tooltip = L.tooltip({
      permanent: true,
      direction: 'top',
      className: 'draw-tooltip'
    })
    .setContent('Click to start drawing land boundary. Double-click to finish.')
    .setLatLng([20.5937, 78.9629]);
    
    // We only show the tooltip when the map is focused and no polygon is drawn
    const updateTooltip = () => {
      if (drawnItems.current.getLayers().length > 0) {
        map.closeTooltip();
      } else {
        // Position it roughly in the center of the view
        tooltip.setLatLng(map.getCenter());
        map.openTooltip(tooltip);
      }
    };

    map.on('draw:created', (e: any) => {
      const { layer } = e;
      drawnItems.current.clearLayers();
      drawnItems.current.addLayer(layer);
      processDrawnItem(layer);
      updateTooltip();
    });

    map.on('draw:edited', (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: any) => {
        processDrawnItem(layer);
      });
    });

    map.on('draw:deleted', () => {
      onParcelDrawn(null);
      updateTooltip();
    });

    updateTooltip();

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [initialGeoJson]);

  const processDrawnItem = (layer: L.Polygon) => {
    const geoJson = layer.toGeoJSON();
    const latLngs = layer.getLatLngs() as L.LatLng[][];
    
    // Calculate centroid
    const bounds = layer.getBounds();
    const centroid = bounds.getCenter();
    
    // Calculate area (square meters) using Leaflet.GeometryUtil or similar
    // Leaflet.Draw polygon tool already provides area if enabled
    // We'll use L.GeometryUtil if available or a simple approximation
    // Actually, L.SphericalUtil (part of some plugins) is better for meters
    // But since we want to avoid extra plugins if possible, we'll use a standard area calc
    
    // A simple way to get area in sq meters for polygons in Leaflet:
    const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0] as L.LatLng[]);

    const latStr = centroid.lat.toFixed(6);
    const lngStr = centroid.lng.toFixed(6);
    const parcelId = `TL-${latStr}-${lngStr}`;

    onParcelDrawn({
      parcelId,
      geoJson,
      centroid: { lat: centroid.lat, lng: centroid.lng },
      area
    });
  };

  const handleReset = () => {
    drawnItems.current.clearLayers();
    onParcelDrawn(null);
    if (mapInstance.current) {
        mapInstance.current.setView([20.5937, 78.9629], 5);
    }
  };

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg border border-border overflow-hidden" />
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-2 right-2 z-[1000] bg-background/80 backdrop-blur-md"
        onClick={handleReset}
        type="button"
      >
        Reset Map
      </Button>
    </div>
  );
};

// Simple Button component if not using shadcn/ui here, but we should use the one from the app
import { Button } from './ui/button';

export default ParcelMap;
