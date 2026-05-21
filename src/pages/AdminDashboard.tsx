import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { AddHostelModal } from '@/components/AddHostelModal';
import { EditHostelModal } from '@/components/EditHostelModal';
import { RejectionReasonDialog } from '@/components/RejectionReasonDialog';
import { ChatPanel, ChatUnreadBadge } from '@/components/ChatPanel';
import { Building2, Users, MapPin, Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, Clock, LogOut, TrendingUp, MessageSquare } from 'lucide-react';
import { HostelRatingBadge } from '@/components/HostelReviews';
import { useToast } from '@/hooks/use-toast';
import { Hostel } from '@/types/hostel';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalMode, setEditModalMode] = useState<'view' | 'edit'>('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<string | null>(null);

  // Rejection reason dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [hostelToReject, setHostelToReject] = useState<{ id: string; name: string } | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Chat state
  const [chatHostel, setChatHostel] = useState<{ id: string; name: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => { checkAuth(); }, [navigate]);

  useEffect(() => {
    fetchHostels();
    const channel = supabase
      .channel('admin-hostels-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, () => { fetchHostels(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/admin'); return; }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').single();
    if (!roleData) navigate('/admin');
    else setAdminId(session.user.id);
  };

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const { data: hostelsData, error } = await supabase
        .from('hostels')
        .select(`*, room_types (id, type, price_per_student, available_rooms)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const hostelsWithRooms = (hostelsData || []).map((hostel: any) => ({
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
        status: hostel.status, ownerId: hostel.owner_id,
      }));
      setHostels(hostelsWithRooms);
    } catch {
      toast({ title: 'Error', description: 'Failed to load hostels.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const totalRooms = hostels.reduce((sum, h) => sum + h.totalRooms, 0);
  const totalAvailable = hostels.reduce((sum, h) => sum + h.availableRooms, 0);
  const pendingCount = hostels.filter((h: any) => h.status === 'pending').length;
  const approvedCount = hostels.filter((h: any) => h.status === 'approved').length;

  const handleApproveHostel = async (id: string) => {
    try {
      await supabase.from('hostels').update({ status: 'approved', rejection_reason: null }).eq('id', id);
      toast({ title: 'Approved', description: 'Hostel is now visible to students.' });
      fetchHostels();
    } catch { toast({ title: 'Error', description: 'Failed to approve.', variant: 'destructive' }); }
  };

  const openRejectDialog = (id: string, name: string) => {
    setHostelToReject({ id, name });
    setRejectDialogOpen(true);
  };

  const handleRejectHostel = async (reason: string) => {
    if (!hostelToReject) return;
    setIsRejecting(true);
    try {
      await supabase.from('hostels').update({ status: 'rejected', rejection_reason: reason || null }).eq('id', hostelToReject.id);
      toast({ title: 'Rejected', description: 'Hostel has been rejected.' });
      fetchHostels();
    } catch { toast({ title: 'Error', description: 'Failed to reject.', variant: 'destructive' }); }
    finally {
      setIsRejecting(false);
      setRejectDialogOpen(false);
      setHostelToReject(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    navigate('/admin');
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
      fetchHostels();
    } catch { toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' }); }
    finally { setDeleteDialogOpen(false); setHostelToDelete(null); }
  };

  const handleViewDetails = (hostelId: string) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (hostel) { setSelectedHostel(hostel); setEditModalMode('view'); setEditModalOpen(true); }
  };

  const openChat = (hostelId: string, hostelName: string) => {
    setChatHostel({ id: hostelId, name: hostelName });
    setChatOpen(true);
  };

  const stats = [
    { label: 'Total Hostels', value: hostels.length, icon: Building2, color: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/15', iconColor: 'text-primary', border: 'border-primary/20' },
    { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'from-accent/20 to-accent/5', iconBg: 'bg-accent/15', iconColor: 'text-accent', border: 'border-accent/20' },
    { label: 'Total Rooms', value: totalRooms, icon: Users, color: 'from-indigo-500/20 to-indigo-500/5', iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-500', border: 'border-indigo-500/20' },
    { label: 'Available Rooms', value: totalAvailable, icon: TrendingUp, color: 'from-success/20 to-success/5', iconBg: 'bg-success/15', iconColor: 'text-success', border: 'border-success/20' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-10 animate-fade-in-down">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
              <Building2 className="h-3.5 w-3.5" />Admin Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Hostel Management</h1>
            <p className="text-muted-foreground mt-1">Review and manage all registered hostels</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300 flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {stats.map((stat, i) => (
            <Card key={stat.label} className={`relative overflow-hidden border ${stat.border} shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color}`} />
              <CardContent className="relative p-5">
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

        {/* Hostels Table Card */}
        <Card className="shadow-card border-border/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/40 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display">All Hostels</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{hostels.length} total · {approvedCount} approved · {pendingCount} pending</p>
              </div>
              <AddHostelModal trigger={
                <Button className="h-10 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow/50 transition-all duration-300 flex items-center gap-2 shine-effect">
                  <Plus className="h-4 w-4" />Add Hostel
                </Button>
              } />
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
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No hostels yet</h3>
                <p className="text-muted-foreground">Add the first hostel to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {hostels.map((hostel) => (
                  <div key={hostel.id} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/30 transition-colors duration-200 group">
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
                        {(hostel as any).status === 'pending' && (
                          <Badge variant="secondary" className="gap-1 text-xs shrink-0"><Clock className="h-3 w-3" />Pending</Badge>
                        )}
                        {(hostel as any).status === 'approved' && (
                          <Badge className="gap-1 text-xs bg-success/15 text-success border border-success/30 shrink-0"><CheckCircle className="h-3 w-3" />Approved</Badge>
                        )}
                        {(hostel as any).status === 'rejected' && (
                          <Badge variant="destructive" className="gap-1 text-xs shrink-0"><XCircle className="h-3 w-3" />Rejected</Badge>
                        )}
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
                      {(hostel as any).status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleApproveHostel(hostel.id)} title="Approve" className="h-9 w-9 p-0 rounded-xl hover:bg-success/15 hover:text-success transition-colors">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openRejectDialog(hostel.id, hostel.name)} title="Reject" className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/15 hover:text-destructive transition-colors">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {/* Chat button (only for hostels with an owner) */}
                      {(hostel as any).ownerId && (
                        <div className="relative">
                          <Button variant="ghost" size="sm" onClick={() => openChat(hostel.id, hostel.name)} title="Chat with owner" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {adminId && (
                            <ChatUnreadBadge hostelId={hostel.id} currentUserRole="admin" />
                          )}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(hostel.id)} title="View" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditHostel(hostel.id)} title="Edit" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteHostel(hostel.id)} title="Delete" className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/15 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <EditHostelModal
          hostel={selectedHostel}
          open={editModalOpen}
          onOpenChange={(open) => { setEditModalOpen(open); if (!open) fetchHostels(); }}
          mode={editModalMode}
        />

        {/* Rejection Reason Dialog */}
        <RejectionReasonDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          hostelName={hostelToReject?.name || ''}
          onConfirm={handleRejectHostel}
          isLoading={isRejecting}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hostel?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. This will permanently delete the hostel and all associated room types.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Chat Panel */}
        {chatHostel && adminId && (
          <ChatPanel
            open={chatOpen}
            onOpenChange={setChatOpen}
            hostelId={chatHostel.id}
            hostelName={chatHostel.name}
            currentUserId={adminId}
            currentUserRole="admin"
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;