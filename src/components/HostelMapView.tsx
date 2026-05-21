import { useState } from 'react';
import { MapPin, Eye, Banknote, Users, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hostel } from '@/types/hostel';

interface HostelMapViewProps {
  hostels: Hostel[];
  onViewDetails: (id: string) => void;
}

/**
 * Map view using real Google Maps iframes — no API key required.
 * Each hostel card shows a live Google Maps embed centred on that hostel's
 * coordinates (if set) or its address as a search query.
 */
export const HostelMapView = ({ hostels, onViewDetails }: HostelMapViewProps) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = hostels.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q);
  });

  const mappable = visible.filter((h) => h.latitude && h.longitude);
  const textOnly  = visible.filter((h) => !h.latitude || !h.longitude);

  const getEmbedSrc = (hostel: Hostel) => {
    const query = hostel.latitude && hostel.longitude
      ? `${hostel.latitude},${hostel.longitude}`
      : encodeURIComponent(`${hostel.address}, Ghana`);
    return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
  };

  const getDirectionsUrl = (hostel: Hostel) =>
    hostel.googleMapsLink
      || (hostel.latitude && hostel.longitude
        ? `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hostel.address || hostel.name + ' Ghana')}`);

  const HostelMapCard = ({ hostel }: { hostel: Hostel }) => {
    const isExpanded = expanded === hostel.id;
    return (
      <div className={`rounded-2xl border border-border bg-card shadow-card overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 ${isExpanded ? 'col-span-full md:col-span-2' : ''}`}>
        {/* Google Maps iframe */}
        <div className={`relative bg-muted transition-all duration-300 ${isExpanded ? 'h-80' : 'h-48'}`}>
          <iframe
            title={`Map of ${hostel.name}`}
            src={getEmbedSrc(hostel)}
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full"
          />
          {/* Availability overlay badge */}
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-sm ${
              hostel.availableRooms > 0
                ? 'bg-success/90 text-white'
                : 'bg-slate-600/80 text-white'
            }`}>
              {hostel.availableRooms > 0 ? `${hostel.availableRooms} available` : 'Full'}
            </span>
          </div>
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(isExpanded ? null : hostel.id)}
            className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-black/70 text-foreground shadow-sm hover:bg-white transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Info strip */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{hostel.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="truncate">{hostel.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Banknote className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">₵{hostel.startingPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onViewDetails(hostel.id)}
              className="flex-1 h-8 rounded-xl text-xs bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View Details
            </Button>
            <a
              href={getDirectionsUrl(hostel)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              title="Open in Google Maps"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter hostels by name or location…"
          className="pl-10 h-11 rounded-xl border-2"
        />
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{visible.length} hostel{visible.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-success" />
          <span>{mappable.length} with precise pin</span>
        </div>
        {textOnly.length > 0 && (
          <>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
              <span>{textOnly.length} by address only</span>
            </div>
          </>
        )}
      </div>

      {/* Map cards grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hostels match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((hostel) => (
            <HostelMapCard key={hostel.id} hostel={hostel} />
          ))}
        </div>
      )}

      {/* Tip for owners */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        💡 Hostels without coordinates show approximate Google Maps search results. Owners can add precise coordinates in the Edit Hostel form for an exact pin.
      </p>
    </div>
  );
};
