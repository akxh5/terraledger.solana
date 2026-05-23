import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertCircle, Maximize2, Map as MapIcon, Ruler, Info } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ParcelMapViewerProps {
  geoJsonCid: string;
  parcelId?: string;
  metadata?: any;
  height?: string;
}

const ParcelMapViewer: React.FC<ParcelMapViewerProps> = ({
  geoJsonCid,
  parcelId,
  metadata,
  height = "300px"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parcelData, setParcelData] = useState<any>(null);

  useEffect(() => {
    const fetchGeoJson = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${geoJsonCid}`);
        if (!response.ok) throw new Error('Failed to fetch boundary data');
        const data = await response.json();
        setParcelData(data);
      } catch (err) {
        console.error('Error fetching GeoJSON:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (geoJsonCid) {
      fetchGeoJson();
    }
  }, [geoJsonCid]);

  useEffect(() => {
    if (!mapRef.current || !parcelData || mapInstance.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        zoomControl: true
    }).setView([20.5937, 78.9629], 5);
    mapInstance.current = map;

    // Add tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    try {
      const geoLayer = L.geoJSON(parcelData, {
        style: {
          color: '#10b981',
          weight: 3,
          opacity: 0.8,
          fillColor: '#10b981',
          fillOpacity: 0.2
        }
      }).addTo(map);

      map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });
    } catch (err) {
      console.error('Error rendering GeoJSON:', err);
      setError('Invalid boundary data format');
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [parcelData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-secondary/20 rounded-lg border border-border" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Loading boundary data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-destructive/5 rounded-lg border border-destructive/20 text-destructive px-4 text-center" style={{ height }}>
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest mb-1">Error Loading Map</p>
        <p className="text-[10px] opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg border border-border overflow-hidden group">
        <div ref={mapRef} style={{ height }} className="w-full" />
        <div className="absolute top-2 right-2 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur-md" title="Open in full screen">
                <Maximize2 size={14} />
            </Button>
        </div>
      </div>

      {metadata && (
        <Card className="border-border/50 bg-secondary/10 overflow-hidden shadow-none">
          <CardContent className="p-3 grid grid-cols-2 gap-3 text-[10px]">
            <div className="space-y-1">
              <p className="text-muted-foreground uppercase font-bold flex items-center gap-1">
                <MapIcon size={10} className="text-primary" /> Centroid
              </p>
              <p className="font-mono">{metadata.centroid?.lat.toFixed(4)}, {metadata.centroid?.lng.toFixed(4)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Ruler size={10} className="text-primary" /> Area
              </p>
              <p className="font-bold">{metadata.area?.toLocaleString()} m²</p>
            </div>
            {metadata.locationDescription && (
              <div className="col-span-2 space-y-1 pt-1 border-t border-border/30">
                <p className="text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <Info size={10} className="text-primary" /> Description
                </p>
                <p className="italic">"{metadata.locationDescription}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParcelMapViewer;
