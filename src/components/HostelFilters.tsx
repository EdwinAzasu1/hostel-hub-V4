import { useState, useEffect } from 'react';
import { Search, X, Sparkles, MapPin, Banknote, Home, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FilterOptions } from '@/types/hostel';
import { supabase } from '@/integrations/supabase/client';

interface HostelFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export const HostelFilters = ({ filters, onFiltersChange, onReset }: HostelFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    const { data } = await supabase.from('hostels').select('location');
    if (data) {
      const uniqueLocations = [...new Set(data.map(h => h.location))].sort();
      setLocations(uniqueLocations);
    }
  };

  const handleSearchChange   = (value: string) => onFiltersChange({ ...filters, searchQuery: value });
  const handleLocationChange = (value: string) => onFiltersChange({ ...filters, location: value });
  const handlePriceChange    = (values: number[]) => onFiltersChange({ ...filters, minPrice: values[0], maxPrice: values[1] });
  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    const newRoomTypes = checked ? [...filters.roomTypes, roomType] : filters.roomTypes.filter(t => t !== roomType);
    onFiltersChange({ ...filters, roomTypes: newRoomTypes });
  };

  const roomTypes = ['Single (1-in-1)', 'Double (2-in-1)', 'Quad (4-in-1)'];
  const hasActiveFilters = filters.searchQuery || filters.location || filters.roomTypes.length > 0;
  const activeCount = (filters.searchQuery ? 1 : 0) + (filters.location ? 1 : 0) + filters.roomTypes.length;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/12 group-focus-within:bg-primary/22 transition-colors z-10">
          <Search className="text-primary h-4 w-4" />
        </div>
        <Input
          placeholder="Search by name or location..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-12 h-12 rounded-2xl border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm focus:border-primary/50 transition-all duration-300 text-sm neon-focus"
        />
        {filters.searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--glass-bg)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="group w-full flex items-center justify-between h-12 px-4 rounded-2xl glass-card border-[var(--glass-border)] hover:border-primary/35 transition-all duration-300 shine-effect"
      >
        <span className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/18 to-accent/18 group-hover:from-primary/28 group-hover:to-accent/28 transition-colors">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Filter Options</span>
        </span>
        <div className="flex items-center gap-2.5">
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.45)]">
              {activeCount}
            </span>
          )}
          <div className={`p-1 rounded-lg transition-all duration-300 ${showFilters ? 'rotate-180 bg-primary/15' : 'bg-muted/60'}`}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up border-[var(--glass-border)]" style={{ animationDuration: '0.3s' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/6 via-accent/4 to-transparent">
            <p className="text-sm font-semibold text-foreground">Refine Results</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="space-y-6 px-5 py-5">
            {/* Location Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-primary/12">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                Location
              </label>
              <Select value={filters.location || '__all__'} onValueChange={(v) => handleLocationChange(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-11 border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm rounded-xl transition-all neon-focus">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="__all__" className="rounded-lg">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location} className="rounded-lg">{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-accent/12">
                  <Banknote className="h-3.5 w-3.5 text-accent" />
                </div>
                Price Range
              </label>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm font-bold text-primary px-3 py-1.5 rounded-xl glass-subtle border border-primary/20">
                  ₵{filters.minPrice.toLocaleString()}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/25 via-border to-accent/25" />
                <span className="text-sm font-bold text-accent px-3 py-1.5 rounded-xl glass-subtle border border-accent/20">
                  ₵{filters.maxPrice.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={handlePriceChange}
                max={12000}
                min={2000}
                step={100}
                className="w-full"
              />
            </div>

            {/* Room Types */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-success/12">
                  <Home className="h-3.5 w-3.5 text-success" />
                </div>
                Room Types
              </label>
              <div className="space-y-2">
                {roomTypes.map((roomType) => (
                  <label
                    key={roomType}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      filters.roomTypes.includes(roomType)
                        ? 'border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 shadow-[0_2px_12px_hsl(var(--primary)/0.15)]'
                        : 'border-[var(--glass-border-subtle)] bg-[var(--glass-bg-subtle)] hover:border-primary/28 hover:bg-[var(--glass-bg)]'
                    }`}
                  >
                    <Checkbox
                      id={roomType}
                      checked={filters.roomTypes.includes(roomType)}
                      onCheckedChange={(checked) => handleRoomTypeChange(roomType, checked as boolean)}
                      className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">{roomType}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
