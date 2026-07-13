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
import { Building2, MapPin, Sparkles, TrendingUp, Users, Zap, Shield, Heart, Map, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { toast } = useToast();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    location: '',
    minPrice: 2000,
    maxPrice: 12000,
    roomTypes: [],
    searchQuery: ''
  });
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    fetchHostels();
    const channel = supabase
      .channel('listing-hostels-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, () => { fetchHostels(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch ratings for all hostels
  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await supabase.from('reviews').select('hostel_id, rating');
      if (!data) return;
      const map: Record<string, { avg: number; count: number }> = {};
      data.forEach(({ hostel_id, rating }) => {
        if (!map[hostel_id]) map[hostel_id] = { avg: 0, count: 0 };
        map[hostel_id].avg += rating;
        map[hostel_id].count += 1;
      });
      Object.keys(map).forEach(id => { map[id].avg = map[id].avg / map[id].count; });
      setRatings(map);
    };
    if (hostels.length > 0) fetchRatings();
  }, [hostels]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const { data: hostelsData, error } = await supabase
        .from('hostels')
        .select(`*, room_types (id, type, price_per_student, available_rooms)`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const hostelsWithRooms: Hostel[] = (hostelsData || []).map(hostel => ({
        id: hostel.id,
        name: hostel.name,
        description: hostel.description,
        location: hostel.location,
        address: hostel.address,
        googleMapsLink: hostel.google_maps_link || undefined,
        managerName: hostel.manager_name,
        managerPhone: hostel.manager_phone,
        managerEmail: hostel.manager_email,
        images: Array.isArray(hostel.images) ? hostel.images : [],
        roomTypes: (hostel.room_types || []).map((rt: any) => ({
          id: rt.id,
          type: rt.type as 'Single (1-in-1)' | 'Double (2-in-1)' | 'Quad (4-in-1)',
          pricePerStudent: rt.price_per_student,
          availableRooms: rt.available_rooms
        })),
        totalRooms: hostel.total_rooms,
        startingPrice: hostel.starting_price,
        availableRooms: hostel.available_rooms,
        amenities: Array.isArray(hostel.amenities) ? hostel.amenities : [],
        latitude: hostel.latitude ?? undefined,
        longitude: hostel.longitude ?? undefined,
        createdAt: new Date(hostel.created_at),
        updatedAt: new Date(hostel.updated_at),
      }));

      setHostels(hostelsWithRooms);
    } catch (error) {
      console.error('Error fetching hostels:', error);
      toast({ title: 'Error', description: 'Failed to load hostels. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredHostels = useMemo(() => {
    return hostels.filter(hostel => {
      if (filters.location && hostel.location !== filters.location) return false;
      if (hostel.startingPrice < filters.minPrice || hostel.startingPrice > filters.maxPrice) return false;
      if (filters.roomTypes.length > 0) {
        const hasMatchingRoomType = hostel.roomTypes.some(room => filters.roomTypes.includes(room.type));
        if (!hasMatchingRoomType) return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return hostel.name.toLowerCase().includes(query) ||
               hostel.location.toLowerCase().includes(query) ||
               hostel.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [filters, hostels]);

  const handleViewDetails = (hostelId: string) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (hostel) { setSelectedHostel(hostel); setIsModalOpen(true); }
  };

  const handleFiltersReset = () => {
    setFilters({ location: '', minPrice: 2000, maxPrice: 12000, roomTypes: [], searchQuery: '' });
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const selectedCompareHostels = hostels.filter(h => compareIds.includes(h.id));

  const totalRooms = hostels.reduce((acc, h) => acc + h.totalRooms, 0);
  const availableRooms = hostels.reduce((acc, h) => acc + h.availableRooms, 0);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl float-delayed pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl animate-pulse-scale pointer-events-none" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-sm font-semibold mb-10 animate-fade-in-down shadow-lg">
              <Sparkles className="h-4 w-4 animate-pulse-scale" />
              <span>Trusted by 1000+ Students</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-8 animate-fade-in-up leading-tight">
              Find Your
              <span className="block mt-2 relative">
                <span className="relative z-10">Perfect Hostel</span>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-accent/50 blur-lg" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/85 max-w-3xl mx-auto mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.15s' }}>
              Browse verified hostels near Central University Ghana.
              <span className="block mt-1">Compare prices and find your ideal home today.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-14 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              {[
                { icon: Shield, label: 'Verified Listings' },
                { icon: Zap, label: 'Instant Booking' },
                { icon: Heart, label: 'Best Prices' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium hover:bg-white/20 transition-all duration-300 cursor-default">
                  <feature.icon className="h-4 w-4" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              {[
                { icon: Building2, value: hostels.length, label: 'Hostels', color: 'from-white/20 to-white/10' },
                { icon: Users, value: totalRooms, label: 'Total Rooms', color: 'from-white/20 to-white/10' },
                { icon: TrendingUp, value: availableRooms, label: 'Available', color: 'from-success/30 to-success/10' }
              ].map((stat, i) => (
                <div key={i} className={`text-center p-5 md:p-6 rounded-2xl bg-gradient-to-br ${stat.color} backdrop-blur-md border border-white/25 hover:border-white/45 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] group`}>
                  <div className="flex justify-center mb-3">
                    <div className="p-2.5 rounded-xl bg-white/12 group-hover:bg-white/22 transition-colors">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/70 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 120L48 108C96 96 192 72 288 60C384 48 480 48 576 54C672 60 768 72 864 78C960 84 1056 84 1152 78C1248 72 1344 60 1392 54L1440 48V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <HostelFilters filters={filters} onFiltersChange={setFilters} onReset={handleFiltersReset} />
            </div>
          </div>

          {/* Hostels Grid / Map */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-10">
              <div className="animate-slide-in-left">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Available Hostels</h2>
                <p className="text-muted-foreground mt-2 text-lg">
                  {filteredHostels.length} {filteredHostels.length === 1 ? 'hostel' : 'hostels'} found
                </p>
              </div>
              <div className="flex items-center gap-3">
                {filters.location && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 text-sm font-medium animate-scale-in">
                    <MapPin className="h-4 w-4" />
                    <span>{filters.location}</span>
                  </div>
                )}
                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`h-8 w-8 p-0 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className={`h-8 w-8 p-0 rounded-lg transition-all ${viewMode === 'map' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Map view"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse rounded-3xl overflow-hidden glass-card">
                    <div className="bg-gradient-to-br from-muted/60 to-muted/30 h-56" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-muted/60 rounded-xl w-3/4" />
                      <div className="h-4 bg-muted/50 rounded-lg w-1/2" />
                      <div className="h-4 bg-muted/50 rounded-lg w-full" />
                      <div className="h-4 bg-muted/50 rounded-lg w-2/3" />
                      <div className="h-12 bg-gradient-to-r from-primary/15 to-accent/15 rounded-2xl w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'map' ? (
              <HostelMapView hostels={filteredHostels} onViewDetails={handleViewDetails} />
            ) : filteredHostels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
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
              <div className="text-center py-20 px-4 animate-fade-in-up">
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-3">No hostels found</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">Try adjusting your filters or search terms to find available hostels.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-gradient-to-b from-muted/30 to-muted/50 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow transition-all duration-300 group-hover:shadow-glow group-hover:scale-105">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">CU Hostel Finder</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Central University Ghana. Made with <Heart className="inline h-4 w-4 text-accent mx-1" /> for students.
            </p>
          </div>
        </div>
      </footer>

      <HostelDetailsModal hostel={selectedHostel} open={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* Comparison Bar */}
      <HostelComparisonBar
        selectedIds={compareIds}
        onClear={() => setCompareIds([])}
        onCompare={() => setCompareOpen(true)}
        hostels={hostels}
      />

      {/* Comparison Dialog */}
      <HostelComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        hostels={selectedCompareHostels}
        onViewDetails={handleViewDetails}
        ratings={ratings}
        onRemove={(id) => setCompareIds(prev => prev.filter(x => x !== id))}
      />
    </div>
  );
};

export default Index;
