import { useState, useEffect, useRef } from 'react';
import {
  Search, X, MapPin, Banknote, Home, SlidersHorizontal,
  Grid3X3, Map, ChevronDown, RotateCcw, BedDouble,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FilterOptions } from '@/types/hostel';
import { supabase } from '@/integrations/supabase/client';

interface HostelFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  viewMode: 'grid' | 'map';
  onViewModeChange: (mode: 'grid' | 'map') => void;
  resultCount: number;
}

const ROOM_TYPES = ['Single (1-in-1)', 'Double (2-in-1)', 'Quad (4-in-1)'];
const ROOM_SHORT: Record<string, string> = {
  'Single (1-in-1)': 'Single',
  'Double (2-in-1)': 'Double',
  'Quad (4-in-1)': 'Quad',
};

export const HostelFilters = ({
  filters, onFiltersChange, onReset,
  viewMode, onViewModeChange, resultCount,
}: HostelFiltersProps) => {
  const [locations, setLocations]     = useState<string[]>([]);
  const [priceOpen, setPriceOpen]     = useState(false);
  const [moreOpen,  setMoreOpen]      = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  const moreRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchLocations(); }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) setPriceOpen(false);
      if (moreRef.current  && !moreRef.current.contains(e.target as Node))  setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchLocations = async () => {
    const { data } = await supabase.from('hostels').select('location').eq('status', 'approved');
    if (data) setLocations([...new Set(data.map(h => h.location))].sort());
  };

  const set = (patch: Partial<FilterOptions>) => onFiltersChange({ ...filters, ...patch });

  const toggleRoomType = (rt: string) => {
    const cur = filters.roomTypes;
    set({ roomTypes: cur.includes(rt) ? cur.filter(x => x !== rt) : [...cur, rt] });
  };

  const activeCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.location    ? 1 : 0) +
    (filters.minPrice > 2000 || filters.maxPrice < 12000 ? 1 : 0) +
    filters.roomTypes.length;

  const priceChanged = filters.minPrice > 2000 || filters.maxPrice < 12000;

  return (
    <div className="flex flex-wrap items-center gap-2.5">

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative group flex-1 min-w-[180px] max-w-xs">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors z-10 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-primary" />
        </div>
        <Input
          placeholder="Search hostels…"
          value={filters.searchQuery}
          onChange={e => set({ searchQuery: e.target.value })}
          className="pl-10 h-10 rounded-xl text-sm"
        />
        {filters.searchQuery && (
          <button
            onClick={() => set({ searchQuery: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Location ────────────────────────────────────────────────── */}
      <div className="min-w-[140px]">
        <Select
          value={filters.location || '__all__'}
          onValueChange={v => set({ location: v === '__all__' ? '' : v })}
        >
          <SelectTrigger className={`h-10 rounded-xl text-sm gap-1.5 border transition-all ${
            filters.location
              ? 'border-primary/40 bg-primary/8 text-primary'
              : 'border-[var(--glass-border)]'
          }`}>
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="__all__" className="rounded-lg">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc} className="rounded-lg">{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Price Range (popover) ────────────────────────────────────── */}
      <div className="relative" ref={priceRef}>
        <button
          onClick={() => { setPriceOpen(o => !o); setMoreOpen(false); }}
          className={`flex items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-medium transition-all ${
            priceChanged
              ? 'border-primary/40 bg-primary/8 text-primary'
              : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground hover:border-primary/30 hover:bg-[var(--glass-bg-subtle)]'
          }`}
        >
          <Banknote className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {priceChanged
              ? `₵${(filters.minPrice/1000).toFixed(0)}k – ₵${(filters.maxPrice/1000).toFixed(0)}k`
              : 'Price'}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${priceOpen ? 'rotate-180' : ''}`} />
        </button>

        {priceOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 w-72 glass-strong rounded-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-hover)] p-5 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Price Range</p>
              {priceChanged && (
                <button
                  onClick={() => set({ minPrice: 2000, maxPrice: 12000 })}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
            <div className="flex justify-between items-center mb-4 gap-2">
              <span className="text-sm font-bold text-primary px-3 py-1.5 rounded-xl glass-subtle border border-primary/20">
                ₵{filters.minPrice.toLocaleString()}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/25 to-accent/25" />
              <span className="text-sm font-bold text-accent px-3 py-1.5 rounded-xl glass-subtle border border-accent/20">
                ₵{filters.maxPrice.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={([min, max]) => set({ minPrice: min, maxPrice: max })}
              max={12000} min={2000} step={100}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* ── Room Types (popover) ──────────────────────────────────────── */}
      <div className="relative" ref={moreRef}>
        <button
          onClick={() => { setMoreOpen(o => !o); setPriceOpen(false); }}
          className={`flex items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-medium transition-all ${
            filters.roomTypes.length > 0
              ? 'border-primary/40 bg-primary/8 text-primary'
              : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground hover:border-primary/30 hover:bg-[var(--glass-bg-subtle)]'
          }`}
        >
          <BedDouble className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {filters.roomTypes.length > 0
              ? filters.roomTypes.map(rt => ROOM_SHORT[rt]).join(', ')
              : 'Room Type'}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
        </button>

        {moreOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 w-56 glass-strong rounded-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow-hover)] p-3 animate-fade-in-up space-y-1.5" style={{ animationDuration: '0.2s' }}>
            {ROOM_TYPES.map(rt => {
              const active = filters.roomTypes.includes(rt);
              return (
                <button
                  key={rt}
                  onClick={() => toggleRoomType(rt)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-medium text-left transition-all duration-200 ${
                    active
                      ? 'border-primary/40 bg-gradient-to-r from-primary/12 to-primary/6 text-primary shadow-[0_2px_8px_hsl(var(--primary)/0.15)]'
                      : 'border-transparent hover:border-[var(--glass-border)] hover:bg-[var(--glass-bg-subtle)] text-foreground'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    active ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                  }`}>
                    {active && <div className="w-2 h-2 rounded-sm bg-white" />}
                  </div>
                  {rt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Active filter chips ──────────────────────────────────────── */}
      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-destructive/30 bg-destructive/8 text-destructive text-sm font-medium hover:bg-destructive/15 transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Clear</span>
          <span className="px-1.5 py-0.5 rounded-full bg-destructive/15 text-xs font-bold">{activeCount}</span>
        </button>
      )}

      {/* ── Spacer ─────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Result count ─────────────────────────────────────────────── */}
      <span className="hidden md:block text-sm text-muted-foreground font-medium px-2">
        <span className="font-bold text-foreground">{resultCount}</span> hostel{resultCount !== 1 ? 's' : ''}
      </span>

      {/* ── View toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border-subtle)]">
        <button
          onClick={() => onViewModeChange('grid')}
          title="Grid view"
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
            viewMode === 'grid'
              ? 'bg-background shadow-sm text-primary border border-[var(--glass-border)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Grid</span>
        </button>
        <button
          onClick={() => onViewModeChange('map')}
          title="Map view"
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
            viewMode === 'map'
              ? 'bg-background shadow-sm text-primary border border-[var(--glass-border)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Map</span>
        </button>
      </div>
    </div>
  );
};
