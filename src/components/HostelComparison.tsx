import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, GitCompare, MapPin, Star, Users, Banknote, CheckCircle } from 'lucide-react';
import { Hostel } from '@/types/hostel';
import { AMENITY_OPTIONS } from '@/types/hostel';

interface HostelComparisonProps {
  hostels: Hostel[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onViewDetails: (id: string) => void;
  ratings: Record<string, { avg: number; count: number }>;
}

export const HostelComparisonBar = ({
  selectedIds,
  onClear,
  onCompare,
  hostels,
}: {
  selectedIds: string[];
  onClear: () => void;
  onCompare: () => void;
  hostels: Hostel[];
}) => {
  if (selectedIds.length === 0) return null;

  const selected = hostels.filter((h) => selectedIds.includes(h.id));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-in-up">
      <div className="bg-card/95 backdrop-blur-md border-t border-border shadow-2xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground flex-shrink-0">
              <GitCompare className="h-4 w-4 text-primary" />
              <span>Compare ({selectedIds.length}/3)</span>
            </div>
            {selected.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-sm flex-shrink-0"
              >
                <span className="font-medium text-foreground truncate max-w-[120px]">{h.name}</span>
                <button
                  onClick={() => {/* handled by parent */}}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Remove ${h.name} from comparison`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onClear} className="rounded-xl h-9">
              Clear
            </Button>
            <Button
              size="sm"
              onClick={onCompare}
              disabled={selectedIds.length < 2}
              className="rounded-xl h-9 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow/30 hover:opacity-90"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HostelComparisonDialog = ({
  open,
  onOpenChange,
  hostels,
  onViewDetails,
  ratings,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostels: Hostel[];
  onViewDetails: (id: string) => void;
  ratings: Record<string, { avg: number; count: number }>;
  onRemove: (id: string) => void;
}) => {
  const colCount = hostels.length;
  const gridClass = colCount === 2 ? 'grid-cols-2' : 'grid-cols-3';

  const rows: { label: string; render: (h: Hostel) => React.ReactNode }[] = [
    {
      label: 'Image',
      render: (h) => (
        <div className="h-32 rounded-xl overflow-hidden bg-muted">
          {h.images?.[0] ? (
            <img src={h.images[0]} alt={h.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Location',
      render: (h) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>{h.location}</span>
        </div>
      ),
    },
    {
      label: 'Starting Price',
      render: (h) => (
        <div className="flex items-center gap-1.5">
          <Banknote className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">₵{h.startingPrice.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">/yr</span>
        </div>
      ),
    },
    {
      label: 'Rating',
      render: (h) => {
        const r = ratings[h.id];
        return r ? (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-bold text-foreground">{r.avg.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({r.count} reviews)</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No reviews yet</span>
        );
      },
    },
    {
      label: 'Available Rooms',
      render: (h) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-success" />
          <span className={`font-semibold ${h.availableRooms > 0 ? 'text-success' : 'text-muted-foreground'}`}>
            {h.availableRooms}
          </span>
          <span className="text-xs text-muted-foreground">of {h.totalRooms} total</span>
        </div>
      ),
    },
    {
      label: 'Room Types',
      render: (h) => (
        <div className="space-y-1">
          {h.roomTypes.map((rt) => (
            <div key={rt.id} className="text-xs flex items-center justify-between">
              <span className="text-muted-foreground">{rt.type.split(' (')[0]}</span>
              <span className="font-medium text-foreground">₵{rt.pricePerStudent.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'Amenities',
      render: (h) => {
        if (!h.amenities || h.amenities.length === 0) {
          return <span className="text-sm text-muted-foreground">Not specified</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {AMENITY_OPTIONS.filter(a => h.amenities?.includes(a.key)).map(a => (
              <span key={a.key} className="text-xs px-2 py-0.5 rounded-full bg-primary/8 border border-primary/20 text-primary flex items-center gap-1">
                {a.icon} {a.label}
              </span>
            ))}
            {AMENITY_OPTIONS.filter(a => !h.amenities?.includes(a.key)).map(a => (
              <span key={a.key} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground/50 flex items-center gap-1 line-through decoration-muted-foreground/30">
                {a.icon} {a.label}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <GitCompare className="h-5 w-5 text-primary" />
            Compare Hostels
          </DialogTitle>
        </DialogHeader>

        <div className={`grid ${gridClass} gap-4 mt-2`}>
          {hostels.map((h) => (
            <div key={h.id} className="text-center">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm truncate">{h.name}</h3>
                <button
                  onClick={() => onRemove(h.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-0 border border-border rounded-2xl overflow-hidden">
          {rows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <Separator />}
              <div className={`grid ${gridCount(colCount)} gap-0`}>
                {/* Row label */}
                <div className="px-4 py-4 bg-muted/40 flex items-center">
                  <span className="text-sm font-semibold text-foreground">{row.label}</span>
                </div>
                {/* Row cells */}
                {hostels.map((h) => (
                  <div key={h.id} className="px-4 py-4 border-l border-border">
                    {row.render(h)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action row */}
          <Separator />
          <div className={`grid ${gridCount(colCount)} gap-0`}>
            <div className="px-4 py-4 bg-muted/40 flex items-center">
              <span className="text-sm font-semibold text-foreground">Action</span>
            </div>
            {hostels.map((h) => (
              <div key={h.id} className="px-4 py-4 border-l border-border">
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90"
                  onClick={() => {
                    onOpenChange(false);
                    onViewDetails(h.id);
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function gridCount(n: number) {
  // label col + n hostel cols
  return n === 2 ? 'grid-cols-3' : 'grid-cols-4';
}
