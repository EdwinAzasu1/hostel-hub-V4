import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HostelCard } from '@/components/HostelCard';
import { HostelFilters } from '@/components/HostelFilters';
import { HostelDetailsModal } from '@/components/HostelDetailsModal';
import { HostelComparisonBar, HostelComparisonDialog } from '@/components/HostelComparison';
import { HostelMapView } from '@/components/HostelMapView';
import { FilterOptions, Hostel } from '@/types/hostel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Sparkles, TrendingUp, Users,
  GitCompare, Shield, Heart, MapPin,
} from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [hostels,  setHostels]  = useState<Hostel[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState<FilterOptions>({
    location: '', minPrice: 2000, maxPrice: 12000, roomTypes: [], searchQuery: '',
  });
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [compareIds,     setCompareIds]     = useState<string[]>([]);
  const [compareOpen,    setCompareOpen]    = useState(false);
  const [ratings,        setRatings]        = useState<Record<string, { avg: number; count: number }>>({});
  const [viewMode,       setViewMode]       = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    fetchHostels();
    const ch = supabase
      .channel('listing-hostels-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, fetchHostels)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await supabase.from('reviews').select('hostel_id, rating');
      if (!data) return;
      const map: Record<string, { avg: number; count: number }> = {};
      data.forEach(({ hostel_id, rating }) => {
        if (!map[hostel_id]) map[hostel_id] = { avg: 0, count: 0 };
        map[hostel_id].avg   += rating;
        map[hostel_id].count += 1;
      });
      Object.keys(map).forEach(id => { map[id].avg /= map[id].count; });
      setRatings(map);
    };
    if (hostels.length > 0) fetchRatings();
  }, [hostels]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hostels')
        .select('*, room_types (id, type, price_per_student, available_rooms)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHostels((data || []).map(h => ({
        id: h.id, name: h.name, description: h.description,
        location: h.location, address: h.address,
        googleMapsLink: h.google_maps_link || undefined,
        managerName: h.manager_name, managerPhone: h.manager_phone, managerEmail: h.manager_email,
        images: Array.isArray(h.images) ? h.images : [],
        roomTypes: (h.room_types || []).map((rt: any) => ({
          id: rt.id, type: rt.type as 'Single (1-in-1)' | 'Double (2-in-1)' | 'Quad (4-in-1)',
          pricePerStudent: rt.price_per_student, availableRooms: rt.available_rooms,
        })),
        totalRooms: h.total_rooms, startingPrice: h.starting_price,
        availableRooms: h.available_rooms,
        amenities: Array.isArray(h.amenities) ? h.amenities : [],
        latitude: h.latitude ?? undefined, longitude: h.longitude ?? undefined,
        createdAt: new Date(h.created_at), updatedAt: new Date(h.updated_at),
      })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load hostels.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredHostels = useMemo(() => hostels.filter(h => {
    if (filters.location && h.location !== filters.location)     return false;
    if (h.startingPrice < filters.minPrice || h.startingPrice > filters.maxPrice) return false;
    if (filters.roomTypes.length > 0 && !h.roomTypes.some(r => filters.roomTypes.includes(r.type))) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return h.name.toLowerCase().includes(q) ||
             h.location.toLowerCase().includes(q) ||
             h.description.toLowerCase().includes(q);
    }
    return true;
  }), [filters, hostels]);

  const handleViewDetails   = (id: string)  => { const h = hostels.find(x => x.id === id); if (h) { setSelectedHostel(h); setIsModalOpen(true); } };
  const handleFiltersReset  = ()            => setFilters({ location: '', minPrice: 2000, maxPrice: 12000, roomTypes: [], searchQuery: '' });
  const handleToggleCompare = (id: string)  => setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);

  const totalRooms     = hostels.reduce((a, h) => a + h.totalRooms, 0);
  const availableRooms = hostels.reduce((a, h) => a + h.availableRooms, 0);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl float-delayed pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl animate-pulse-scale pointer-events-none" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-sm font-semibold mb-8 animate-fade-in-down shadow-lg">
              <Sparkles className="h-4 w-4 animate-pulse-scale" />
              <span>Trusted by 1000+ Students</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 animate-fade-in-up leading-tight">
              Find Your
              <span className="block mt-2 relative">
                <span className="relative z-10">Perfect Hostel</span>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-accent/50 blur-lg" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/85 max-w-2xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.15s' }}>
              Browse verified hostels near Central University Ghana.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {[
                { icon: Shield, label: 'Verified Listings' },
                { icon: GitCompare, label: 'Compare Hostels' },
                { icon: Heart,  label: 'Best Prices' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium hover:bg-white/20 transition-all cursor-default">
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </div>
              ))}
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {[
                { icon: Building2,   value: hostels.length, label: 'Hostels',    color: 'from-white/20 to-white/10' },
                { icon: Users,       value: totalRooms,     label: 'Total Rooms', color: 'from-white/20 to-white/10' },
                { icon: TrendingUp,  value: availableRooms, label: 'Available',  color: 'from-success/30 to-success/10' },
              ].map((s, i) => (
                <div key={i} className={`text-center p-4 md:p-5 rounded-2xl bg-gradient-to-br ${s.color} backdrop-blur-md border border-white/25 hover:border-white/45 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] group`}>
                  <div className="flex justify-center mb-2.5">
                    <div className="p-2 rounded-xl bg-white/12 group-hover:bg-white/22 transition-colors">
                      <s.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-0.5">{s.value}</div>
                  <div className="text-xs text-white/70 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L48 72C96 64 192 48 288 40C384 32 480 32 576 36C672 40 768 48 864 52C960 56 1056 56 1152 52C1248 48 1344 40 1392 36L1440 32V80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ── Sticky Filter Bar ──────────────────────────────────────── */}
      <div className="sticky top-16 z-40 border-b border-[var(--glass-border)] bg-background/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <HostelFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleFiltersReset}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resultCount={filteredHostels.length}
          />
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Active location chip */}
        {filters.location && (
          <div className="flex items-center gap-2 mb-5 animate-scale-in">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 text-sm font-semibold">
              <MapPin className="h-4 w-4" />
              {filters.location}
              <button
                onClick={() => setFilters(f => ({ ...f, location: '' }))}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <span className="h-3.5 w-3.5 block leading-none text-base">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse rounded-3xl overflow-hidden glass-card">
                <div className="bg-gradient-to-br from-muted/60 to-muted/30 h-52" />
                <div className="p-5 space-y-3.5">
                  <div className="h-5 bg-muted/60 rounded-xl w-3/4" />
                  <div className="h-4 bg-muted/50 rounded-lg w-1/2" />
                  <div className="h-4 bg-muted/50 rounded-lg w-full" />
                  <div className="h-10 bg-gradient-to-r from-primary/15 to-accent/15 rounded-2xl w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          /* Map — full-width, tall */
          <HostelMapView hostels={filteredHostels} onViewDetails={handleViewDetails} />
        ) : filteredHostels.length > 0 ? (
          /* Hostel grid — 4 cols on XL */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {filteredHostels.map((hostel, index) => (
              <HostelCard
                key={hostel.id}
                hostel={hostel}
                onViewDetails={handleViewDetails}
                index={index}
                isSelected={compareIds.includes(hostel.id)}
                onToggleCompare={handleToggleCompare}
                compareDisabled={compareIds.length >= 3}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24 px-4 animate-fade-in-up">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">No hostels found</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">
              Try adjusting your filters or search terms to find available hostels.
            </p>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-gradient-to-b from-muted/30 to-muted/50 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow transition-all duration-300 group-hover:shadow-glow group-hover:scale-105">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">CU Hostel Finder</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Central University Ghana. Made with{' '}
              <Heart className="inline h-4 w-4 text-accent mx-1" /> for students.
            </p>
          </div>
        </div>
      </footer>

      <HostelDetailsModal hostel={selectedHostel} open={isModalOpen} onOpenChange={setIsModalOpen} />

      <HostelComparisonBar
        selectedIds={compareIds}
        onClear={() => setCompareIds([])}
        onCompare={() => setCompareOpen(true)}
        hostels={hostels}
      />
      <HostelComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        hostels={hostels.filter(h => compareIds.includes(h.id))}
        onViewDetails={handleViewDetails}
        ratings={ratings}
        onRemove={id => setCompareIds(p => p.filter(x => x !== id))}
      />
    </div>
  );
};

export default Index;
