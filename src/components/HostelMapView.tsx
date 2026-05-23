import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, MapPin, Banknote, ExternalLink, BedDouble, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hostel } from '@/types/hostel';

/* ─── Fix broken default Leaflet marker icons in Vite ─────────────────────── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── Custom pin icon ───────────────────────────────────────────────────────── */
const createPin = (available: boolean, selected: boolean) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 42px;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
      ">
        <svg viewBox="0 0 36 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.059 0 0 8.059 0 18c0 12.5 18 24 18 24S36 30.5 36 18C36 8.059 27.941 0 18 0z"
            fill="${selected ? '#f59e0b' : available ? '#7c3aed' : '#6b7280'}"
            stroke="white" stroke-width="2.5"/>
          <circle cx="18" cy="17" r="7" fill="white" fill-opacity="0.9"/>
          <circle cx="18" cy="17" r="4" fill="${selected ? '#f59e0b' : available ? '#7c3aed' : '#6b7280'}"/>
        </svg>
      </div>`,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  });

/* ─── Auto-fit map to all visible markers ────────────────────────────────── */
const FitBounds = ({ hostels }: { hostels: Hostel[] }) => {
  const map = useMap();
  useEffect(() => {
    const pts = hostels.filter(h => h.latitude && h.longitude);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView([pts[0].latitude!, pts[0].longitude!], 16);
      return;
    }
    const bounds = L.latLngBounds(pts.map(h => [h.latitude!, h.longitude!] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [hostels, map]);
  return null;
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
interface HostelMapViewProps {
  hostels: Hostel[];
  onViewDetails: (id: string) => void;
}

// Default center = Central University Ghana, Miotso
const CU_CENTER: [number, number] = [5.7428, -0.0674];

export const HostelMapView = ({ hostels, onViewDetails }: HostelMapViewProps) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = hostels.filter(h => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q);
  });

  const withCoords = filtered.filter(h => h.latitude && h.longitude);
  const noCoords   = filtered.filter(h => !h.latitude || !h.longitude);

  const getGoogleUrl = (h: Hostel) =>
    h.googleMapsLink
      || (h.latitude && h.longitude
        ? `https://www.google.com/maps?q=${h.latitude},${h.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address || h.name)}`);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter hostels by name or location…"
          className="pl-10 h-11 rounded-xl border-2"
        />
      </div>

      {/* Pin legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-primary" />
          <span>Rooms available ({withCoords.filter(h => h.availableRooms > 0).length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span>Full ({withCoords.filter(h => h.availableRooms === 0).length})</span>
        </div>
        {noCoords.length > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{noCoords.length} hostel{noCoords.length > 1 ? 's' : ''} missing coordinates (not shown on map)</span>
          </div>
        )}
      </div>

      {/* Map + sidebar layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-[600px]">

        {/* ── Sidebar list ─────────────────────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
            <p className="text-sm font-semibold text-foreground">{withCoords.length} mapped hostel{withCoords.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {withCoords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <MapPin className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No hostels with coordinates yet.</p>
                <p className="text-xs mt-1">Add lat/lng in the hostel form.</p>
              </div>
            ) : (
              withCoords.map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelected(selected === h.id ? null : h.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group ${selected === h.id ? 'bg-primary/8 border-l-2 border-primary' : ''}`}
                >
                  <p className={`text-sm font-semibold truncate ${selected === h.id ? 'text-primary' : 'text-foreground group-hover:text-primary'} transition-colors`}>
                    {h.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{h.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs font-bold text-primary">₵{h.startingPrice.toLocaleString()}/yr</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${h.availableRooms > 0 ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {h.availableRooms > 0 ? `${h.availableRooms} avail.` : 'Full'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Hostels without coordinates */}
          {noCoords.length > 0 && (
            <div className="border-t border-border bg-amber-50 dark:bg-amber-950/20 flex-shrink-0">
              <div className="px-4 py-2 border-b border-amber-200/50 dark:border-amber-800/30">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  No coordinates set
                </p>
              </div>
              <div className="divide-y divide-amber-100 dark:divide-amber-900/20 max-h-40 overflow-y-auto">
                {noCoords.map(h => (
                  <button
                    key={h.id}
                    onClick={() => onViewDetails(h.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <p className="text-xs font-medium text-foreground truncate">{h.name}</p>
                    <p className="text-[11px] text-muted-foreground">{h.location}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Interactive Map ───────────────────────────────────────────── */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-sm relative min-h-[380px]">
          {withCoords.length === 0 && !search ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 z-10 text-center p-8">
              <MapPin className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No locations set yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Hostel owners or admins need to add <strong>Latitude &amp; Longitude</strong> when adding or editing a hostel.
                Right-click any location on Google Maps to copy the coordinates.
              </p>
            </div>
          ) : null}

          <MapContainer
            center={withCoords.length > 0 ? [withCoords[0].latitude!, withCoords[0].longitude!] : CU_CENTER}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            {/* Google Maps-like road tile layer (CartoDB Voyager) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />

            {/* Auto-fit to all markers */}
            <FitBounds hostels={withCoords} />

            {/* Hostel markers */}
            {withCoords.map(h => (
              <Marker
                key={h.id}
                position={[h.latitude!, h.longitude!]}
                icon={createPin(h.availableRooms > 0, selected === h.id)}
                eventHandlers={{ click: () => setSelected(h.id) }}
              >
                <Popup
                  minWidth={260}
                  maxWidth={300}
                  className="hostel-popup"
                >
                  {/* Popup content */}
                  <div className="font-sans" style={{ fontFamily: 'inherit' }}>
                    {/* Image */}
                    {h.images && h.images.length > 0 && (
                      <div style={{ margin: '-14px -20px 12px', height: '120px', overflow: 'hidden', borderRadius: '4px 4px 0 0' }}>
                        <img
                          src={h.images[0]}
                          alt={h.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Hostel name */}
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b', marginBottom: '4px', lineHeight: 1.3 }}>
                      {h.name}
                    </p>

                    {/* Location */}
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📍 {h.location}
                    </p>

                    {/* Availability badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '14px', fontWeight: 700,
                        color: '#7c3aed',
                      }}>
                        ₵{h.startingPrice.toLocaleString()}<span style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>/yr</span>
                      </span>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px',
                        background: h.availableRooms > 0 ? '#dcfce7' : '#f3f4f6',
                        color: h.availableRooms > 0 ? '#16a34a' : '#6b7280',
                      }}>
                        {h.availableRooms > 0 ? `${h.availableRooms} rooms available` : 'Fully booked'}
                      </span>
                    </div>

                    {/* Room types */}
                    {h.roomTypes && h.roomTypes.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {h.roomTypes.map(rt => (
                          <span key={rt.id} style={{
                            fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
                            background: '#ede9fe', color: '#6d28d9', fontWeight: 600,
                          }}>
                            🛏 {rt.type.split(' (')[0]}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onViewDetails(h.id)}
                        style={{
                          flex: 1, padding: '7px 12px', borderRadius: '8px', border: 'none',
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        View Details
                      </button>
                      <a
                        href={getGoogleUrl(h)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb',
                          background: 'white', color: '#374151', fontSize: '12px',
                          fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                        title="Open in Google Maps"
                      >
                        🗺️
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        💡 Click any pin or hostel name to see details. Missing a hostel? Add its <strong>Latitude &amp; Longitude</strong> in the Edit Hostel form — right-click on Google Maps to copy coordinates.
      </p>
    </div>
  );
};
