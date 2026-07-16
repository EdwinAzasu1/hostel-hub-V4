import { useCallback, useEffect, useRef, useState } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  AttributionControl,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Eye, MapPin, ExternalLink, AlertCircle,
  Search, X, ChevronRight, Layers, Sun, Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hostel } from '@/types/hostel';

/* ── Map styles — inline raster tile objects (100% free, no API key, always works) ── */
const mkRaster = (tiles: string[], attribution: string) => ({
  version: 8 as const,
  sources: {
    tiles: {
      type: 'raster' as const,
      tiles,
      tileSize: 256,
      attribution,
      maxzoom: 19,
    },
  },
  layers: [{ id: 'background', type: 'raster' as const, source: 'tiles' }],
});

const STYLES = {
  street: mkRaster(
    ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ),
  light: mkRaster(
    [
      'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
    ],
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  ),
  dark: mkRaster(
    [
      'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
    ],
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  ),
} as const;
type StyleKey = keyof typeof STYLES;

/* ── MapLibre GL custom CSS overrides ────────────────────────────────────── */
const GL_CSS = `
  .maplibregl-ctrl-group {
    background: rgba(255,255,255,0.75) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255,255,255,0.6) !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    box-shadow: 0 4px 20px rgba(100,80,220,0.15), 0 1px 4px rgba(0,0,0,0.08) !important;
  }
  .maplibregl-ctrl-group button {
    width: 36px !important; height: 36px !important;
    background: transparent !important;
  }
  .maplibregl-ctrl-group button:hover { background: rgba(124,58,237,0.10) !important; }
  .maplibregl-ctrl-group button + button { border-top: 1px solid rgba(255,255,255,0.4) !important; }
  .maplibregl-ctrl-group button span { filter: invert(30%) sepia(80%) saturate(400%) hue-rotate(240deg); }
  .maplibregl-ctrl-attrib {
    background: rgba(255,255,255,0.68) !important;
    backdrop-filter: blur(8px) !important;
    border-radius: 8px !important;
    border: 1px solid rgba(255,255,255,0.5) !important;
    font-size: 10px !important;
    padding: 2px 6px !important;
  }
  .maplibregl-popup-content {
    padding: 0 !important;
    border-radius: 20px !important;
    border: 1px solid rgba(255,255,255,0.6) !important;
    background: rgba(255,255,255,0.85) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    box-shadow: 0 12px 40px rgba(100,80,220,0.2), 0 2px 8px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.9) !important;
    overflow: hidden !important;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  }
  .maplibregl-popup-tip { display: none !important; }
  .maplibregl-popup-close-button {
    top: 10px !important; right: 10px !important;
    width: 26px !important; height: 26px !important;
    font-size: 18px !important; line-height: 1 !important;
    color: #666 !important;
    background: rgba(0,0,0,0.07) !important;
    border-radius: 50% !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    transition: background 0.2s !important;
  }
  .maplibregl-popup-close-button:hover { background: rgba(0,0,0,0.15) !important; color: #222 !important; }
  .maplibregl-canvas { cursor: grab !important; }
  .maplibregl-canvas:active { cursor: grabbing !important; }
  /* Hover name tooltip — compact pill */
  .hostel-name-tooltip .maplibregl-popup-content {
    border-radius: 12px !important;
    padding: 0 !important;
    background: rgba(255,255,255,0.92) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    box-shadow: 0 4px 16px rgba(100,80,220,0.18), 0 1px 4px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.9) !important;
    border: 1px solid rgba(124,58,237,0.2) !important;
    pointer-events: none !important;
  }
  .hostel-name-tooltip .maplibregl-popup-close-button { display: none !important; }
  @keyframes pin-drop {
    0%   { transform: translateY(-20px) scale(0.8); opacity: 0; }
    60%  { transform: translateY(4px)  scale(1.05); opacity: 1; }
    100% { transform: translateY(0)    scale(1);    opacity: 1; }
  }
  @keyframes pin-ring {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(2.5); opacity: 0;   }
  }
  .map-pin-wrap { animation: pin-drop 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
  .map-pin-ring { animation: pin-ring 2s ease-out infinite; }
`;

/* ── Custom pin component ────────────────────────────────────────────────── */
const Pin = ({
  available, selected, price,
}: { available: boolean; selected: boolean; price: number }) => {
  const base  = selected ? '#f59e0b' : available ? '#7c3aed' : '#6b7280';
  const glow  = selected ? '#fcd34d' : available ? '#a78bfa' : '#9ca3af';
  const dark  = selected ? '#d97706' : available ? '#5b21b6' : '#4b5563';
  const label = price >= 1000 ? `₵${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k` : `₵${price}`;

  return (
    <div className="map-pin-wrap" style={{ position: 'relative', width: 54, height: 62, cursor: 'pointer' }}>
      {/* Pulse ring */}
      {(available || selected) && (
        <div
          className="map-pin-ring"
          style={{
            position: 'absolute', top: 2, left: 3,
            width: 48, height: 48, borderRadius: '50%',
            background: glow, opacity: 0.35,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Diamond body */}
      <div style={{
        position: 'absolute', top: 0, left: 3,
        width: 48, height: 48,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: `linear-gradient(135deg, ${base}, ${dark})`,
        boxShadow: `0 6px 20px ${base}70, 0 2px 6px rgba(0,0,0,0.25)`,
        border: '2.5px solid rgba(255,255,255,0.8)',
      }} />
      {/* Inner label */}
      <div style={{
        position: 'absolute', top: 8, left: 11,
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(255,255,255,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 800, color: base,
        letterSpacing: '-0.3px', fontFamily: "'Plus Jakarta Sans',sans-serif",
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {label}
      </div>
    </div>
  );
};

/* ── Hostel popup card ───────────────────────────────────────────────────── */
const HostelPopup = ({
  hostel, onViewDetails, onClose, getGoogleUrl,
}: {
  hostel: Hostel;
  onViewDetails: (id: string) => void;
  onClose: () => void;
  getGoogleUrl: (h: Hostel) => string;
}) => (
  <div style={{ width: 280, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
    {hostel.images?.[0] && (
      <div style={{ height: 110, overflow: 'hidden', margin: '-1px -1px 0', position: 'relative' }}>
        <img src={hostel.images[0]} alt={hostel.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }} />
      </div>
    )}
    <div style={{ padding: '14px 16px 16px' }}>
      {/* Name */}
      <p style={{ fontSize: 15, fontWeight: 800, color: '#1a0a3a', marginBottom: 3, lineHeight: 1.3 }}>{hostel.name}</p>
      {/* Location */}
      <p style={{ fontSize: 11, color: '#7c6a9e', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        📍 {hostel.location}
      </p>
      {/* Price + availability */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#7c3aed' }}>
          ₵{hostel.startingPrice.toLocaleString()}
          <span style={{ fontSize: 10, fontWeight: 500, color: '#a78bfa' }}>/yr</span>
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          background: hostel.availableRooms > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.10)',
          color: hostel.availableRooms > 0 ? '#059669' : '#6b7280',
          border: `1px solid ${hostel.availableRooms > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.2)'}`,
        }}>
          {hostel.availableRooms > 0 ? `${hostel.availableRooms} rooms left` : 'Fully booked'}
        </span>
      </div>
      {/* Room types */}
      {hostel.roomTypes?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          {hostel.roomTypes.map(rt => (
            <span key={rt.id} style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 999,
              background: 'rgba(124,58,237,0.10)', color: '#6d28d9',
              fontWeight: 700, border: '1px solid rgba(124,58,237,0.2)',
            }}>
              🛏 {rt.type.split(' (')[0]}
            </span>
          ))}
        </div>
      )}
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onViewDetails(hostel.id)}
          style={{
            flex: 1, padding: '9px 14px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124,58,237,0.45)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1';    (e.currentTarget as HTMLElement).style.transform = ''; }}
        >
          👁 View Details
        </button>
        <a
          href={getGoogleUrl(hostel)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '9px 12px', borderRadius: 12,
            border: '1px solid rgba(124,58,237,0.25)',
            background: 'rgba(124,58,237,0.07)',
            color: '#7c3aed', fontSize: 14, textDecoration: 'none',
            display: 'flex', alignItems: 'center',
            transition: 'all 0.2s',
          }}
          title="Open in Google Maps"
        >🗺️</a>
      </div>
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────────────────────────────── */
interface HostelMapViewProps {
  hostels: Hostel[];
  onViewDetails: (id: string) => void;
}

const CU_CENTER = { longitude: -0.0674, latitude: 5.7428 };

export const HostelMapView = ({ hostels, onViewDetails }: HostelMapViewProps) => {
  const [search,    setSearch]   = useState('');
  const [selected,  setSelected] = useState<string | null>(null);
  const [popup,     setPopup]    = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapStyle,  setMapStyle] = useState<StyleKey>('street');
  const [styleOpen, setStyleOpen] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: CU_CENTER.longitude,
    latitude:  CU_CENTER.latitude,
    zoom: 13,
    pitch: 0,
    bearing: 0,
  });
  const cssInjected = useRef(false);
  const mapRef = useRef<any>(null);

  /* Inject MapLibre CSS tweaks once */
  useEffect(() => {
    if (cssInjected.current) return;
    cssInjected.current = true;
    const tag = document.createElement('style');
    tag.textContent = GL_CSS;
    document.head.appendChild(tag);
  }, []);

  /* Filtered lists */
  const filtered   = hostels.filter(h => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q);
  });
  const withCoords = filtered.filter(h => h.latitude && h.longitude);
  const noCoords   = filtered.filter(h => !h.latitude || !h.longitude);

  /* Fly to hostel */
  const flyTo = useCallback((h: Hostel) => {
    setViewState(prev => ({
      ...prev,
      longitude: h.longitude!,
      latitude:  h.latitude!,
      zoom: Math.max(prev.zoom, 15),
    }));
  }, []);

  const handleSidebarClick = (h: Hostel) => {
    const isDeselect = selected === h.id;
    setSelected(isDeselect ? null : h.id);
    setPopup(isDeselect ? null : h.id);
    if (!isDeselect) flyTo(h);
  };

  const handleMarkerClick = (h: Hostel) => {
    setSelected(h.id);
    setPopup(h.id);
  };

  const selectedHostel = hostels.find(h => h.id === selected) ?? null;
  const popupHostel    = hostels.find(h => h.id === popup)    ?? null;

  const getGoogleUrl = (h: Hostel) =>
    h.googleMapsLink
    || (h.latitude && h.longitude
      ? `https://www.google.com/maps?q=${h.latitude},${h.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address || h.name)}`);

  const styleLabels: Record<StyleKey, { label: string; icon: React.ReactNode }> = {
    street:  { label: 'Street', icon: <MapPin className="h-3.5 w-3.5" /> },
    light:   { label: 'Light',  icon: <Sun    className="h-3.5 w-3.5" /> },
    dark:    { label: 'Dark',   icon: <Moon   className="h-3.5 w-3.5" /> },
  };

  return (
    <div className="space-y-3">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors z-10">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by hostel name or area…"
            className="pl-12 h-11 rounded-2xl"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-subtle border border-[var(--glass-border-subtle)] text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
            <span>{withCoords.filter(h => h.availableRooms > 0).length} available</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-subtle border border-[var(--glass-border-subtle)] text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50" />
            <span>{withCoords.filter(h => h.availableRooms === 0).length} full</span>
          </div>
          {noCoords.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {noCoords.length} unmapped
            </div>
          )}
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 180px)', minHeight: 560 }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col glass-card rounded-3xl overflow-hidden border border-[var(--glass-border)]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/6 to-accent/4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/15">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {withCoords.length} hostel{withCoords.length !== 1 ? 's' : ''} on map
                </p>
                <p className="text-[11px] text-muted-foreground">Click to fly to location</p>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {withCoords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                  <MapPin className="h-8 w-8 opacity-30" />
                </div>
                <p className="text-sm font-medium">No hostels with coordinates</p>
                <p className="text-xs mt-1 opacity-70">Add lat/lng in the hostel form</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {withCoords.map(h => (
                  <button
                    key={h.id}
                    onClick={() => handleSidebarClick(h)}
                    className={`group w-full text-left px-3.5 py-3 rounded-2xl border transition-all duration-300 ${
                      selected === h.id
                        ? 'border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 shadow-[0_2px_12px_hsl(var(--primary)/0.18)]'
                        : 'border-transparent hover:border-[var(--glass-border)] hover:bg-[var(--glass-bg-subtle)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                        selected === h.id
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                          : h.availableRooms > 0
                          ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]'
                          : 'bg-muted-foreground/40'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate transition-colors ${
                          selected === h.id ? 'text-primary' : 'text-foreground group-hover:text-primary'
                        }`}>{h.name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{h.location}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 gap-2">
                          <span className="text-xs font-bold text-primary">₵{h.startingPrice.toLocaleString()}/yr</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            h.availableRooms > 0
                              ? 'bg-success/15 text-success'
                              : 'bg-muted/60 text-muted-foreground'
                          }`}>
                            {h.availableRooms > 0 ? `${h.availableRooms} left` : 'Full'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 mt-1.5 transition-all duration-300 ${
                        selected === h.id
                          ? 'text-primary translate-x-0.5'
                          : 'text-muted-foreground/30 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unmapped section */}
          {noCoords.length > 0 && (
            <div className="border-t border-[var(--glass-border)] bg-amber-500/8 flex-shrink-0">
              <div className="px-4 py-2.5 border-b border-amber-500/15">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Missing coordinates
                </p>
              </div>
              <div className="divide-y divide-amber-500/10 max-h-36 overflow-y-auto">
                {noCoords.map(h => (
                  <button key={h.id} onClick={() => onViewDetails(h.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-500/8 transition-colors group">
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{h.name}</p>
                    <p className="text-[10px] text-muted-foreground">{h.location}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Map container ────────────────────────────────────────────── */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-[var(--glass-shadow)] min-h-[380px]">

          {/* Empty state */}
          {withCoords.length === 0 && !search && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-8 glass-strong">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4 animate-pulse-scale">
                <MapPin className="h-10 w-10 text-primary/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No locations set yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Add <strong>Latitude & Longitude</strong> when creating or editing a hostel.
                Right-click on Google Maps to copy coordinates.
              </p>
            </div>
          )}

          {/* Style switcher (top-right overlay) */}
          <div className="absolute top-3 right-3 z-10">
            <div className="relative">
              <button
                onClick={() => setStyleOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass-strong border border-[var(--glass-border)] text-xs font-semibold text-foreground hover:border-primary/35 transition-all shadow-[var(--glass-shadow)] shine-effect"
              >
                <Layers className="h-4 w-4 text-primary" />
                {styleLabels[mapStyle].label}
              </button>
              {styleOpen && (
                <div className="absolute right-0 top-full mt-2 glass-strong rounded-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-hover)] overflow-hidden min-w-[120px] animate-scale-in">
                  {(Object.keys(STYLES) as StyleKey[]).map(key => (
                    <button
                      key={key}
                      onClick={() => { setMapStyle(key); setStyleOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors text-left ${
                        mapStyle === key
                          ? 'bg-primary/15 text-primary'
                          : 'hover:bg-[var(--glass-bg)] text-foreground'
                      }`}
                    >
                      {styleLabels[key].icon}
                      {styleLabels[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── MapLibre GL Map ─────────────────────────────────────────── */}
          <Map
            ref={mapRef}
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            mapStyle={STYLES[mapStyle]}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            {/* Controls */}
            <NavigationControl position="top-left" showCompass visualizePitch />
            <ScaleControl position="bottom-right" />
            <AttributionControl compact position="bottom-left" />

            {/* Markers */}
            {withCoords.map(h => (
              <Marker
                key={h.id}
                longitude={h.longitude!}
                latitude={h.latitude!}
                anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); handleMarkerClick(h); }}
              >
                <div
                  onMouseEnter={() => { if (popup !== h.id) setHoveredId(h.id); }}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Pin
                    available={h.availableRooms > 0}
                    selected={selected === h.id}
                    price={h.startingPrice}
                  />
                </div>
              </Marker>
            ))}

            {/* Hover name tooltip */}
            {(() => {
              const hh = hoveredId && popup !== hoveredId
                ? withCoords.find(h => h.id === hoveredId)
                : null;
              return hh ? (
                <Popup
                  longitude={hh.longitude!}
                  latitude={hh.latitude!}
                  anchor="bottom"
                  offset={[0, -68]}
                  closeButton={false}
                  closeOnClick={false}
                  className="hostel-name-tooltip"
                  maxWidth="220px"
                >
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                    padding: '8px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: hh.availableRooms > 0 ? '#7c3aed' : '#6b7280',
                      boxShadow: hh.availableRooms > 0 ? '0 0 6px #a78bfa' : 'none',
                    }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a0a3a', margin: 0, lineHeight: 1.3 }}>
                        {hh.name}
                      </p>
                      <p style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600, margin: '2px 0 0' }}>
                        ₵{hh.startingPrice.toLocaleString()}/yr
                      </p>
                    </div>
                  </div>
                </Popup>
              ) : null;
            })()}

            {/* Click popup */}
            {popupHostel && (
              <Popup
                longitude={popupHostel.longitude!}
                latitude={popupHostel.latitude!}
                anchor="bottom"
                offset={[0, -64]}
                onClose={() => setPopup(null)}
                closeOnClick={false}
                maxWidth="300px"
              >
                <HostelPopup
                  hostel={popupHostel}
                  onViewDetails={onViewDetails}
                  onClose={() => setPopup(null)}
                  getGoogleUrl={getGoogleUrl}
                />
              </Popup>
            )}
          </Map>

          {/* Floating selected-hostel mini card (bottom of map) */}
          {selectedHostel && !popup && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-72 animate-fade-in-up pointer-events-auto" style={{ animationDuration: '0.3s' }}>
              <div className="glass-strong rounded-2xl border border-[var(--glass-border)] overflow-hidden shadow-[var(--glass-shadow-hover)]">
                {selectedHostel.images?.[0] && (
                  <div className="h-20 overflow-hidden relative">
                    <img src={selectedHostel.images[0]} alt={selectedHostel.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                <div className="p-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{selectedHostel.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      <span className="truncate">{selectedHostel.location}</span>
                    </div>
                    <p className="text-xs font-bold text-primary mt-0.5">₵{selectedHostel.startingPrice.toLocaleString()}/yr</p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <Button size="sm" className="h-7 px-3 text-xs rounded-xl" onClick={() => onViewDetails(selectedHostel.id)}>
                      <Eye className="h-3 w-3" /> Details
                    </Button>
                    <button
                      onClick={() => setSelected(null)}
                      className="h-7 px-3 text-xs rounded-xl glass-subtle border border-[var(--glass-border-subtle)] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="h-3 w-3" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tip bar */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl glass-subtle border border-[var(--glass-border-subtle)] text-xs text-muted-foreground text-center">
        <MapPin className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
        <span>
          Click any pin to open its details popup. Use the <strong className="text-foreground">Layers</strong> button to switch map style (Street / Light / Dark).
          Missing a hostel? Add its <strong className="text-foreground">Lat/Lng</strong> in the Edit form.
        </span>
      </div>
    </div>
  );
};
