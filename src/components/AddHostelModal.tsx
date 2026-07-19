import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload, CheckCircle2, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AMENITY_OPTIONS } from '@/types/hostel';

interface RoomTypeForm {
  type: 'Single (1-in-1)' | 'Double (2-in-1)' | 'Quad (4-in-1)';
  pricePerStudent: number;
  availableRooms: number;
}

interface AddHostelModalProps {
  trigger: React.ReactNode;
  ownerId?: string;
}

export const AddHostelModal = ({ trigger, ownerId }: AddHostelModalProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    googleMapsLink: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    latitude: '',
    longitude: '',
  });
  const [roomTypes, setRoomTypes] = useState<RoomTypeForm[]>([
    { type: 'Single (1-in-1)', pricePerStudent: 0, availableRooms: 0 }
  ]);
  const [images, setImages] = useState<FileList | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [geocoded, setGeocoded] = useState(false);

  /** Extract lat/lng from any Google Maps URL format — no network call needed */
  const extractCoordsFromUrl = (url: string): { lat: number; lng: number } | null => {
    if (!url.trim()) return null;
    // Format 1: /maps/@lat,lng,zoom  or  /maps/place/name/@lat,lng
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    // Format 2: ?q=lat,lng  or  &q=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    // Format 3: !3dlat!4dlng  (embed / share URLs)
    const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
    // Format 4: ll=lat,lng
    const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    return null;
  };

  const isGoogleMapsUrl = (url: string) =>
    /google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url);

  const handleGoogleMapsLinkChange = (url: string) => {
    handleInputChange('googleMapsLink', url);
    const coords = extractCoordsFromUrl(url);
    if (coords) {
      setFormData(prev => ({
        ...prev,
        googleMapsLink: url,
        latitude: coords.lat.toFixed(6),
        longitude: coords.lng.toFixed(6),
      }));
      setGeocoded(true);
    } else {
      setGeocoded(false);
    }
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase.from('hostels').select('location');
    if (!error && data) {
      const unique = Array.from(new Set(data.map((d: any) => d.location).filter(Boolean)));
      setLocations(unique);
    }
  };

  useEffect(() => {
    if (open) fetchLocations();
  }, [open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoomTypeChange = (index: number, field: keyof RoomTypeForm, value: any) => {
    setRoomTypes(prev => prev.map((room, i) =>
      i === index ? { ...room, [field]: value } : room
    ));
  };

  const addRoomType = () => {
    setRoomTypes(prev => [...prev, { type: 'Single (1-in-1)', pricePerStudent: 0, availableRooms: 0 }]);
  };

  const removeRoomType = (index: number) => {
    if (roomTypes.length > 1) {
      setRoomTypes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(e.target.files);
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const calculateStartingPrice = () => {
    const prices = roomTypes.filter(room => room.pricePerStudent > 0).map(room => room.pricePerStudent);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const calculateTotalRooms = () => {
    return roomTypes.reduce((sum, room) => sum + room.availableRooms, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      address: formData.address.trim(),
      googleMapsLink: formData.googleMapsLink.trim(),
      managerName: formData.managerName.trim(),
      managerPhone: formData.managerPhone.trim(),
      managerEmail: formData.managerEmail.trim(),
    };

    const missingFields: string[] = [];
    if (!sanitized.name) missingFields.push('Name');
    if (!sanitized.description) missingFields.push('Description');
    if (!sanitized.location) missingFields.push('Location');
    if (!sanitized.address) missingFields.push('Address');
    if (!sanitized.managerName) missingFields.push('Manager Name');
    if (!sanitized.managerPhone) missingFields.push('Manager Phone');
    if (!sanitized.managerEmail) missingFields.push('Manager Email');

    if (missingFields.length) {
      toast({ title: 'Missing required fields', description: missingFields.join(', '), variant: 'destructive' });
      return;
    }

    if (roomTypes.some(room => room.pricePerStudent <= 0 || room.availableRooms <= 0)) {
      toast({ title: 'Error', description: 'Please ensure all room types have valid prices and room counts.', variant: 'destructive' });
      return;
    }

    const imageCount = images ? images.length : 0;
    const totalSteps = 2 + imageCount + (imageCount > 0 ? 1 : 0);
    let completedSteps = 0;

    const advance = (status: string) => {
      completedSteps += 1;
      setUploadProgress(Math.round((completedSteps / totalSteps) * 100));
      setUploadStatus(status);
    };

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStatus('Saving hostel information…');

    try {
      const lat = formData.latitude ? parseFloat(formData.latitude) : null;
      const lng = formData.longitude ? parseFloat(formData.longitude) : null;

      const { data: hostelData, error: hostelError } = await supabase
        .from('hostels')
        .insert({
          name: sanitized.name,
          description: sanitized.description,
          location: sanitized.location,
          address: sanitized.address,
          google_maps_link: sanitized.googleMapsLink || null,
          manager_name: sanitized.managerName,
          manager_phone: sanitized.managerPhone,
          manager_email: sanitized.managerEmail,
          images: [],
          total_rooms: calculateTotalRooms(),
          starting_price: calculateStartingPrice(),
          available_rooms: calculateTotalRooms(),
          amenities: selectedAmenities,
          latitude: lat,
          longitude: lng,
          ...(ownerId ? { owner_id: ownerId, status: 'pending' } : {}),
        })
        .select()
        .single();

      if (hostelError) throw hostelError;
      advance('Saving room types…');

      const roomTypesData = roomTypes.map(room => ({
        hostel_id: hostelData.id,
        type: room.type,
        price_per_student: room.pricePerStudent,
        available_rooms: room.availableRooms,
      }));

      const { error: roomTypesError } = await supabase.from('room_types').insert(roomTypesData);
      if (roomTypesError) throw roomTypesError;

      if (images && images.length > 0) {
        const uploadedUrls: string[] = [];
        const files = Array.from(images);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          advance(`Uploading image ${i + 1} of ${files.length}…`);
          const ext = file.name.split('.').pop();
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const path = `${hostelData.id}/${unique}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('hostel-images').upload(path, file, { cacheControl: '3600', upsert: false });
          if (uploadError) throw uploadError;
          const { data: pub } = supabase.storage.from('hostel-images').getPublicUrl(path);
          if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
        }
        advance('Finalising hostel listing…');
        if (uploadedUrls.length > 0) {
          const { error: updateImagesError } = await supabase.from('hostels').update({ images: uploadedUrls }).eq('id', hostelData.id);
          if (updateImagesError) throw updateImagesError;
        }
      }

      setUploadProgress(100);
      setUploadStatus('Done!');
      toast({ title: 'Success', description: `Hostel "${formData.name}" has been added successfully!` });
      await new Promise(res => setTimeout(res, 600));

      setFormData({ name: '', description: '', location: '', address: '', googleMapsLink: '', managerName: '', managerPhone: '', managerEmail: '', latitude: '', longitude: '' });
      setRoomTypes([{ type: 'Single (1-in-1)', pricePerStudent: 0, availableRooms: 0 }]);
      setImages(null);
      setSelectedAmenities([]);
      setUploadProgress(0);
      setUploadStatus('');
      setIsSubmitting(false);
      setOpen(false);
    } catch (error) {
      console.error('Error adding hostel:', error);
      toast({ title: 'Error', description: (error as any)?.message || 'Failed to add hostel. Please try again.', variant: 'destructive' });
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const progressSteps = useMemo(() => {
    const steps = [
      { label: 'Basic Info', done: !!(formData.name && formData.location && formData.description && formData.address) },
      { label: 'Manager', done: !!(formData.managerName && formData.managerPhone && formData.managerEmail) },
      { label: 'Rooms', done: roomTypes.some(r => r.pricePerStudent > 0 && r.availableRooms > 0) },
      { label: 'Images', done: !!(images && images.length > 0) },
    ];
    return steps;
  }, [formData, roomTypes, images]);

  const completedStepsCount = progressSteps.filter(s => s.done).length;
  const progressPercent = (completedStepsCount / progressSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Hostel</DialogTitle>
          <DialogDescription>Fill in the details to add a new hostel to the system.</DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-3 pb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Completion Progress</span>
            <span className="text-muted-foreground">{completedStepsCount}/{progressSteps.length} sections</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex gap-2 flex-wrap">
            {progressSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${step.done ? 'bg-success/10 border-success/30 text-success' : 'bg-muted/50 border-border text-muted-foreground'}`}>
                <CheckCircle2 className={`h-3 w-3 ${step.done ? 'text-success' : 'text-muted-foreground/40'}`} />
                {step.label}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hostel Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter hostel name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g., Miotso Campus" required />
                  {locations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Quick select:</span>
                      {locations.slice(0, 5).map((location) => (
                        <Button key={location} type="button" variant={formData.location === location ? "default" : "outline"} size="sm" className="text-xs h-6" onClick={() => handleInputChange('location', location)}>{location}</Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe the hostel facilities and features" rows={3} required />
              </div>
              {/* Address + Google Maps Link with auto-coordinate extraction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleMapsLink" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Google Maps Link
                    {geocoded && (
                      <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Coordinates detected
                      </span>
                    )}
                  </Label>
                  <Input
                    id="googleMapsLink"
                    value={formData.googleMapsLink}
                    onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                    placeholder="Paste your Google Maps link here"
                    className={geocoded ? 'border-success/60 focus-visible:ring-success/30' : ''}
                  />
                  {formData.googleMapsLink && !geocoded && isGoogleMapsUrl(formData.googleMapsLink) && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      ⚠️ Coordinates not found in this link — try sharing the link from the Google Maps <strong>Share</strong> button for a full URL.
                    </p>
                  )}
                  {!formData.googleMapsLink && (
                    <p className="text-[11px] text-muted-foreground">
                      💡 Open Google Maps → find the hostel → tap <strong>Share</strong> → copy link. Coordinates fill automatically.
                    </p>
                  )}
                </div>
              </div>
              {/* Coordinates — auto-filled from Google Maps link, or enter manually */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Latitude <span className="text-muted-foreground font-normal text-xs">(auto-filled from link)</span>
                  </Label>
                  <Input id="latitude" type="number" step="any" value={formData.latitude} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="e.g. 5.6037" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Longitude <span className="text-muted-foreground font-normal text-xs">(auto-filled from link)</span>
                  </Label>
                  <Input id="longitude" type="number" step="any" value={formData.longitude} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="e.g. -0.1870" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Amenities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {AMENITY_OPTIONS.map((amenity) => {
                  const checked = selectedAmenities.includes(amenity.key);
                  return (
                    <label
                      key={amenity.key}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        checked ? 'border-primary/50 bg-primary/8 shadow-sm' : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleAmenity(amenity.key)}
                        className="sr-only"
                      />
                      <span className="text-2xl">{amenity.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{amenity.label}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Manager Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Manager Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name *</Label>
                  <Input id="managerName" value={formData.managerName} onChange={(e) => handleInputChange('managerName', e.target.value)} placeholder="Enter manager name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerPhone">Phone Number *</Label>
                  <Input id="managerPhone" value={formData.managerPhone} onChange={(e) => handleInputChange('managerPhone', e.target.value)} placeholder="+233 XX XXX XXXX" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerEmail">Email Address *</Label>
                  <Input id="managerEmail" type="email" value={formData.managerEmail} onChange={(e) => handleInputChange('managerEmail', e.target.value)} placeholder="manager@email.com" required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room Types & Pricing</CardTitle>
                <Button type="button" onClick={addRoomType} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Add Room Type</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {roomTypes.map((roomType, index) => (
                <div key={index} className="flex items-end gap-4 p-4 border border-border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Room Type</Label>
                    <Select value={roomType.type} onValueChange={(value: any) => handleRoomTypeChange(index, 'type', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single (1-in-1)">Single (1-in-1)</SelectItem>
                        <SelectItem value="Double (2-in-1)">Double (2-in-1)</SelectItem>
                        <SelectItem value="Quad (4-in-1)">Quad (4-in-1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Price per Student (₵)</Label>
                    <Input type="number" value={roomType.pricePerStudent} onChange={(e) => handleRoomTypeChange(index, 'pricePerStudent', parseInt(e.target.value) || 0)} placeholder="0" min="0" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Available Rooms</Label>
                    <Input type="number" value={roomType.availableRooms} onChange={(e) => handleRoomTypeChange(index, 'availableRooms', parseInt(e.target.value) || 0)} placeholder="0" min="0" />
                  </div>
                  {roomTypes.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeRoomType(index)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Total Rooms:</span> {calculateTotalRooms()}</div>
                  <div><span className="font-medium">Starting Price:</span> ₵{calculateStartingPrice()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Hostel Images</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="images">Upload Multiple Images</Label>
                <div className="flex items-center gap-4">
                  <Input id="images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="flex-1" />
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Upload className="h-4 w-4 mr-2" />
                    {images ? `${images.length} files selected` : 'No files selected'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {isSubmitting && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Uploading Hostel</span>
                </div>
                <span className="tabular-nums font-semibold text-primary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2.5" />
              <p className="text-xs text-muted-foreground">{uploadStatus}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>) : 'Add Hostel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};