import React from 'react';
import { Copy, MapPin, Ruler, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ParcelDrawData } from './ParcelMap';
import { useToast } from '@/hooks/use-toast';

interface ParcelInfoCardProps {
  data: ParcelDrawData;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ParcelInfoCard: React.FC<ParcelInfoCardProps> = ({
  data,
  onConfirm,
  isLoading = false
}) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
    });
  };

  // Unit conversions
  const sqMeters = data.area;
  const sqFeet = sqMeters * 10.7639;
  const acres = sqMeters * 0.000247105;
  const bigha = sqMeters / 2529; // Standard bigha approximation

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
              <MapPin size={10} /> Generated Parcel ID
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                {data.parcelId}
              </code>
              <button 
                onClick={() => copyToClipboard(data.parcelId)}
                className="p-1 hover:bg-primary/20 rounded transition-colors"
                title="Copy ID"
              >
                <Copy size={12} className="text-primary" />
              </button>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1 justify-end">
              <MapPin size={10} /> Centroid
            </p>
            <p className="text-[11px] font-mono text-muted-foreground">
              {data.centroid.lat.toFixed(6)}, {data.centroid.lng.toFixed(6)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t border-primary/10">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase text-muted-foreground font-bold">Area (m²)</p>
            <p className="text-sm font-bold">{sqMeters.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase text-muted-foreground font-bold">Area (ft²)</p>
            <p className="text-sm font-bold">{sqFeet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase text-muted-foreground font-bold">Acres</p>
            <p className="text-sm font-bold">{acres.toFixed(3)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase text-muted-foreground font-bold">Bigha</p>
            <p className="text-sm font-bold">{bigha.toFixed(2)}</p>
          </div>
        </div>

        <Button 
          onClick={onConfirm} 
          className="w-full gap-2 font-bold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>Processing Location...</>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Confirm Location & Proceed
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ParcelInfoCard;
