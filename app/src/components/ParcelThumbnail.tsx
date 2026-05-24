import React, { useEffect, useState } from 'react';
import { Map as MapIcon, Loader2 } from 'lucide-react';

interface ParcelThumbnailProps {
  ipfsCid: string;
}

const ParcelThumbnail: React.FC<ParcelThumbnailProps> = ({ ipfsCid }) => {
  const [geoJsonCid, setGeoJsonCid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`);
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            if (data.geoJsonCid) {
              setGeoJsonCid(data.geoJsonCid);
            }
          }
        }
      } catch (err) {
        // Silently fail, just don't show map
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [ipfsCid]);

  if (loading) {
    return (
      <div className="w-16 h-16 rounded-lg bg-secondary/30 flex items-center justify-center border border-border">
        <Loader2 size={14} className="animate-spin text-muted-foreground opacity-40" />
      </div>
    );
  }

  if (!geoJsonCid) {
    return (
      <div className="w-16 h-16 rounded-lg bg-secondary/10 flex items-center justify-center border border-dashed border-border">
        <MapIcon size={14} className="text-muted-foreground opacity-20" />
      </div>
    );
  }

  // Static map preview from Pinata if available or just a placeholder
  // Since we don't have a static map API easily, we'll show an icon indicating a map is present
  return (
    <div className="w-16 h-16 rounded-lg bg-emerald-500/10 flex flex-col items-center justify-center border border-emerald-500/20 relative overflow-hidden group">
      <MapIcon size={16} className="text-emerald-400" />
      <span className="text-[8px] uppercase font-bold text-emerald-400 mt-1">MAP</span>
      <div className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default ParcelThumbnail;
