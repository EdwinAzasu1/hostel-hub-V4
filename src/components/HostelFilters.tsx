import { useState, useEffect } from 'react';
import { Search, X, Sparkles, MapPin, Banknote, Home, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const handleSearchChange = (value: string) => onFiltersChange({ ...filters, searchQuery: value });
  const handleLocationChange = (value: string) => onFiltersChange({ ...filters, location: value });
  const handlePriceChange = (values: number[]) => onFiltersChange({ ...filters, minPrice: values[0], maxPrice: values[1] });
  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    const newRoomTypes = checked ? [...filters.roomTypes, roomType] : filters.roomTypes.filter(t => t !== roomType);
    onFiltersChange({ ...filters, roomTypes: newRoomTypes });
  };

  const roomTypes = ['Single (1-in-1)', 'Double (2-in-1)', 'Quad (4-in-1)'];
  const hasActiveFilters = filters.searchQuery || filters.location || filters.roomTypes.length > 0;
  const activeCount = (filters.searchQuery ? 1 : 0) + (filters.location ? 1 : 0) + filters.roomTypes.length;

  return (
    <div className="space-y-4">
      {/* Search Bar — always visible */}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors z-10">
          <Search className="text-primary h-4 w-4" />
        </div>
        <Input
          placeholder="Search by name or location..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-12 h-12 border-2 border-border focus:border-primary/60 rounded-xl transition-all duration-300 bg-card"
        />
        {filters.searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full justify-between h-12 border-2 hover:border-primary/50 hover:shadow-glow/20 transition-all duration-300 group bg-card rounded-xl"
      >
        <span className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 group-hover:from-primary/25 group-hover:to-accent/25 transition-colors">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold">Filter Options</span>
        </span>
        <div className="flex items-center gap-2.5">
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {activeCount}
            </span>
          )}
          <div className={`p-1 rounded-lg bg-muted/60 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </Button>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-2 border-border/60 shadow-card overflow-hidden rounded-2xl animate-fade-in-up" style={{ animationDuration: '0.35s' }}>
          <CardHeader className="pb-4 pt-5 px-5 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">Refine Results</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 rounded-lg"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 px-5 pb-6">
            {/* Location Filter */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                Location
              </label>
              <Select value={filters.location || '__all__'} onValueChange={(v) => handleLocationChange(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-11 border-2 border-border focus:border-primary/60 rounded-xl transition-all">
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
              <label className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Banknote className="h-3.5 w-3.5 text-accent" />
                </div>
                Price Range
              </label>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  ₵{filters.minPrice.toLocaleString()}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/20 via-border to-accent/20" />
                <span className="text-sm font-bold text-accent px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
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
              <label className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <Home className="h-3.5 w-3.5 text-success" />
                </div>
                Room Types
              </label>
              <div className="space-y-2">
                {roomTypes.map((roomType) => (
                  <label
                    key={roomType}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${filters.roomTypes.includes(roomType)
                        ? 'border-primary/40 bg-gradient-to-r from-primary/8 to-primary/4 shadow-sm'
                        : 'border-transparent hover:border-primary/25 hover:bg-muted/50'
                      }`}
                  >
                    <Checkbox
                      id={roomType}
                      checked={filters.roomTypes.includes(roomType)}
                      onCheckedChange={(checked) => handleRoomTypeChange(roomType, checked as boolean)}
                      className="h-4.5 w-4.5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">{roomType}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
