import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { AddHostelModal } from '@/components/AddHostelModal';
import { EditHostelModal } from '@/components/EditHostelModal';
import { ChatPanel, ChatUnreadBadge } from '@/components/ChatPanel';
import { Building2, Plus, Edit2, Trash2, Eye, Clock, CheckCircle, XCircle, LogOut, MapPin, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { HostelRatingBadge } from '@/components/HostelReviews';
import { useToast } from '@/hooks/use-toast';
import { Hostel } from '@/types/hostel';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hostels, setHostels] = useState<(Hostel & { status?: string; rejectionReason?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalMode, setEditModalMode] = useState<'view' | 'edit'>('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<string | null>(null);

  // Chat state
  const [chatHostel, setChatHostel] = useState<{ id: string; name: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('owner-hostels-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hostels', filter: `owner_id=eq.${userId}` }, () => { fetchHostels(userId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/owner'); return; }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'hostel_owner').single();
    if (!roleData) { navigate('/owner'); return; }
    setUserId(session.user.id);
    fetchHostels(session.user.id);
  };

  const fetchHostels = async (uid: string) => {
    try {
      setLoading(true);
      const { data: hostelsData, error } = await supabase
        .from('hostels')
        .select(`*, room_types (id, type, price_per_student, available_rooms)`)
        .eq('owner_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (hostelsData || []).map((hostel: any) => ({
        id: hostel.id, name: hostel.name, description: hostel.description,
        location: hostel.location, address: hostel.address,
        googleMapsLink: hostel.google_maps_link || undefined,
        managerName: hostel.manager_name, managerPhone: hostel.manager_phone, managerEmail: hostel.manager_email,
        images: Array.isArray(hostel.images) ? hostel.images : [],
        roomTypes: (hostel.room_types || []).map((rt: any) => ({ id: rt.id, type: rt.type, pricePerStudent: rt.price_per_student, availableRooms: rt.available_rooms })),
        totalRooms: hostel.total_rooms, startingPrice: hostel.starting_price, availableRooms: hostel.available_rooms,
        amenities: Array.isArray(hostel.amenities) ? hostel.amenities : [],
        latitude: hostel.latitude ?? undefined, longitude: hostel.longitude ?? undefined,
        rejectionReason: hostel.rejection_reason ?? null,
        createdAt: new Date(hostel.created_at), updatedAt: new Date(hostel.updated_at),
        status: hostel.status,
      }));
      setHostels(mapped);
    } catch {
      toast({ title: 'Error', description: 'Failed to load your hostels.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    navigate('/owner');
  };

  const handleViewDetails = (hostelId: string) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (hostel) { setSelectedHostel(hostel); setEditModalMode('view'); setEditModalOpen(true); }
  };

  const handleEditHostel = (hostelId: string) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (hostel) { setSelectedHostel(hostel); setEditModalMode('edit'); setEditModalOpen(true); }
  };

  const handleDeleteHostel = (hostelId: string) => { setHostelToDelete(hostelId); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!hostelToDelete) return;
    try {
      await supabase.from('hostels').delete().eq('id', hostelToDelete);
      toast({ title: 'Success', description: 'Hostel deleted successfully.' });
      if (userId) fetchHostels(userId);
    } catch { toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' }); }
    finally { setDeleteDialogOpen(false); setHostelToDelete(null); }
  };

  const handleResubmit = async (hostelId: string) => {
    try {
      await supabase.from('hostels').update({ status: 'pending', rejection_reason: null }).eq('id', hostelId);
      toast({ title: 'Resubmitted!', description: 'Your hostel has been resubmitted for admin review.' });
      if (userId) fetchHostels(userId);
    } catch {
      toast({ title: 'Error', description: 'Failed to resubmit hostel.', variant: 'destructive' });
    }
  };

  const openChat = (hostelId: string, hostelName: string) => {
    setChatHostel({ id: hostelId, name: hostelName });
    setChatOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />Pending Review</Badge>;
      case 'approved': return <Badge className="gap-1 text-xs bg-success/15 text-success border border-success/30"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{status || 'Unknown'}</Badge>;
    }
  };

  const pendingCount = hostels.filter(h => h.status === 'pending').length;
  const approvedCount = hostels.filter(h => h.status === 'approved').length;

  const stats = [
    { label: 'Total Listings', value: hostels.length, icon: Building2, color: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/15', iconColor: 'text-primary', border: 'border-primary/20' },
    { label: 'Approved', value: approvedCount, icon: CheckCircle, color: 'from-success/20 to-success/5', iconBg: 'bg-success/15', iconColor: 'text-success', border: 'border-success/20' },
    { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'from-accent/20 to-accent/5', iconBg: 'bg-accent/15', iconColor: 'text-accent', border: 'border-accent/20' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-10 animate-fade-in-down">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
              <Building2 className="h-3.5 w-3.5" />Owner Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">My Hostels</h1>
            <p className="text-muted-foreground mt-1">Manage your hostel listings</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300 flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {stats.map((stat, i) => (
            <Card key={stat.label} className={`relative overflow-hidden border ${stat.border} shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color}`} />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-3xl font-display font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hostels Card */}
        <Card className="shadow-card border-border/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/40 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display">My Hostel Listings</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Add and manage your hostel properties</p>
              </div>
              <AddHostelModal
                trigger={
                  <Button className="h-10 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow/50 transition-all duration-300 flex items-center gap-2 shine-effect">
                    <Plus className="h-4 w-4" />Add Hostel
                  </Button>
                }
                ownerId={userId || undefined}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-0">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-5 border-b border-border/40 animate-pulse">
                    <div className="w-20 h-16 bg-muted rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded-lg w-1/3" />
                      <div className="h-4 bg-muted rounded-lg w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hostels.length === 0 ? (
              <div className="text-center py-20 px-4 animate-fade-in-up">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">No hostels yet</h3>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">Add your first hostel to start reaching students at Central University Ghana.</p>
                <AddHostelModal
                  trigger={
                    <Button className="h-11 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow/50 transition-all duration-300 flex items-center gap-2 shine-effect px-6">
                      <Plus className="h-4 w-4" />Add Your First Hostel
                    </Button>
                  }
                  ownerId={userId || undefined}
                />
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {hostels.map((hostel) => (
                  <div key={hostel.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors duration-200 group">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-muted">
                        {hostel.images && hostel.images.length > 0 ? (
                          <img src={hostel.images[0]} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{hostel.name}</h3>
                          {getStatusBadge(hostel.status)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{hostel.location}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-semibold text-primary">₵{hostel.startingPrice?.toLocaleString()}+/yr</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{hostel.availableRooms} available</span>
                          <HostelRatingBadge hostelId={hostel.id} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Chat with admin */}
                        <div className="relative">
                          <Button variant="ghost" size="sm" onClick={() => openChat(hostel.id, hostel.name)} title="Chat with admin"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {userId && <ChatUnreadBadge hostelId={hostel.id} currentUserRole="owner" />}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(hostel.id)} title="View"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditHostel(hostel.id)} title="Edit"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteHostel(hostel.id)} title="Delete"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/15 hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Rejection reason banner */}
                    {hostel.status === 'rejected' && (
                      <div className="mt-3 ml-24 p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-destructive mb-0.5">Rejected</p>
                          {hostel.rejectionReason ? (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Reason: </span>{hostel.rejectionReason}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No reason provided by admin.</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResubmit(hostel.id)}
                          className="h-8 px-3 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs flex-shrink-0"
                        >
                          <RefreshCw className="h-3 w-3 mr-1.5" />
                          Resubmit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <EditHostelModal
          hostel={selectedHostel}
          open={editModalOpen}
          onOpenChange={(open) => { setEditModalOpen(open); if (!open && userId) fetchHostels(userId); }}
          mode={editModalMode}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hostel?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this hostel and all associated room types.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Chat Panel */}
        {chatHostel && userId && (
          <ChatPanel
            open={chatOpen}
            onOpenChange={setChatOpen}
            hostelId={chatHostel.id}
            hostelName={chatHostel.name}
            currentUserId={userId}
            currentUserRole="owner"
          />
        )}
      </main>
    </div>
  );
};

export default OwnerDashboard;
