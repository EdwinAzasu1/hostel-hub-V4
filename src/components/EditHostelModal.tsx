import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload, Eye, Edit3, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Hostel, RoomType, AMENITY_OPTIONS } from '@/types/hostel';
import { supabase } from '@/integrations/supabase/client';
import { AmenitiesBadges } from './AmenitiesBadges';

interface RoomTypeForm {
  id?: string;
  type: 'Single (1-in-1)' | 'Double (2-in-1)' | 'Quad (4-in-1)';
  pricePerStudent: number;
  availableRooms: number;
}

interface EditHostelModalProps {
  hostel: Hostel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'edit';
}

export const EditHostelModal = ({ hostel, open, onOpenChange, mode }: EditHostelModalProps) => {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode);
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
  const [roomTypes, setRoomTypes] = useState<RoomTypeForm[]>([]);
  const [images, setImages] = useState<FileList | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (open) { fetchLocations(); }
  }, [open]);

  const fetchLocations = async () => {
    const { data } = await supabase.from('hostels').select('location');
    if (data) {
      const uniqueLocations = [...new Set(data.map(h => h.location))].sort();
      setLocations(uniqueLocations);
    }
  };

  useEffect(() => {
    if (hostel) {
      setFormData({
        name: hostel.name,
        description: hostel.description,
        location: hostel.location,
        address: hostel.address,
        googleMapsLink: hostel.googleMapsLink || '',
        managerName: hostel.managerName,
        managerPhone: hostel.managerPhone,
        managerEmail: hostel.managerEmail,
        latitude: hostel.latitude ? String(hostel.latitude) : '',
        longitude: hostel.longitude ? String(hostel.longitude) : '',
      });
      setRoomTypes(hostel.roomTypes.map(room => ({
        id: room.id,
        type: room.type,
        pricePerStudent: room.pricePerStudent,
        availableRooms: room.availableRooms
      })));
      setSelectedAmenities(hostel.amenities || []);
    }
    setCurrentMode(mode);
  }, [hostel, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoomTypeChange = (index: number, field: keyof RoomTypeForm, value: any) => {
    setRoomTypes(prev => prev.map((room, i) => i === index ? { ...room, [field]: value } : room));
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
    if (!formData.name || !formData.location || !formData.managerName) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (roomTypes.some(room => room.pricePerStudent <= 0 || room.availableRooms <= 0)) {
      toast({ title: 'Error', description: 'Please ensure all room types have valid prices and room counts.', variant: 'destructive' });
      return;
    }
    if (!hostel) return;

    try {
      const lat = formData.latitude ? parseFloat(formData.latitude) : null;
      const lng = formData.longitude ? parseFloat(formData.longitude) : null;

      const { error: hostelError } = await supabase.from('hostels').update({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        google_maps_link: formData.googleMapsLink || null,
        manager_name: formData.managerName,
        manager_phone: formData.managerPhone,
        manager_email: formData.managerEmail,
        total_rooms: calculateTotalRooms(),
        starting_price: calculateStartingPrice(),
        available_rooms: calculateTotalRooms(),
        amenities: selectedAmenities,
        latitude: lat,
        longitude: lng,
      }).eq('id', hostel.id);
      if (hostelError) throw hostelError;

      const { error: deleteError } = await supabase.from('room_types').delete().eq('hostel_id', hostel.id);
      if (deleteError) throw deleteError;

      const roomTypesData = roomTypes.map(room => ({
        hostel_id: hostel.id,
        type: room.type,
        price_per_student: room.pricePerStudent,
        available_rooms: room.availableRooms,
      }));
      const { error: roomTypesError } = await supabase.from('room_types').insert(roomTypesData);
      if (roomTypesError) throw roomTypesError;

      if (images && images.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of Array.from(images)) {
          const ext = file.name.split('.').pop();
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const path = `${hostel.id}/${unique}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('hostel-images').upload(path, file, { cacheControl: '3600', upsert: false });
          if (uploadError) throw uploadError;
          const { data: pub } = supabase.storage.from('hostel-images').getPublicUrl(path);
          if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
        }
        if (uploadedUrls.length > 0) {
          const nextImages = [...(hostel.images || []), ...uploadedUrls];
          const { error: updateImagesError } = await supabase.from('hostels').update({ images: nextImages }).eq('id', hostel.id);
          if (updateImagesError) throw updateImagesError;
        }
      }

      toast({ title: 'Success', description: `Hostel "${formData.name}" has been updated successfully!` });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating hostel:', error);
      toast({ title: 'Error', description: 'Failed to update hostel. Please try again.', variant: 'destructive' });
    }
  };

  const toggleMode = () => { setCurrentMode(currentMode === 'view' ? 'edit' : 'view'); };

  if (!hostel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {currentMode === 'view' ? (<><Eye className="h-5 w-5" /> View Hostel Details</>) : (<><Edit3 className="h-5 w-5" /> Edit Hostel</>)}
              </DialogTitle>
              <DialogDescription>
                {currentMode === 'view' ? 'View and manage hostel information' : 'Update hostel details and save changes'}
              </DialogDescription>
            </div>
            <Button type="button" variant="outline" onClick={toggleMode}>
              {currentMode === 'view' ? (<><Edit3 className="h-4 w-4 mr-2" />Edit</>) : (<><Eye className="h-4 w-4 mr-2" />View</>)}
            </Button>
          </div>
        </DialogHeader>

        {currentMode === 'view' ? (
          <div className="space-y-6">
            {hostel.images && hostel.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hostel.images.map((image, index) => (
                  <img key={index} src={image} alt={`${hostel.name} - Image ${index + 1}`} className="w-full h-32 object-cover rounded-lg" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                ))}
              </div>
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </div>
            )}

            <Card>
              <CardHeader><CardTitle className="text-lg">{hostel.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{hostel.location}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="mt-1">{hostel.address}</p>
                  </div>
                </div>
                {hostel.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm">{hostel.description}</p>
                  </div>
                )}
                {hostel.amenities && hostel.amenities.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amenities</Label>
                    <div className="mt-2">
                      <AmenitiesBadges amenities={hostel.amenities} />
                    </div>
                  </div>
                )}
                {(hostel.latitude || hostel.longitude) && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Map Coordinates</Label>
                    <p className="mt-1 text-sm font-mono text-muted-foreground">{hostel.latitude}, {hostel.longitude}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Manager Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Manager Name</Label>
                  <p className="mt-1">{hostel.managerName}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{hostel.managerPhone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{hostel.managerEmail}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Room Types & Pricing</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hostel.roomTypes.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{room.type}</p>
                        <p className="text-sm text-muted-foreground">₵{room.pricePerStudent} per student/year</p>
                      </div>
                      <Badge variant={room.availableRooms > 0 ? "default" : "secondary"}>{room.availableRooms} available</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="font-medium">Total Rooms:</span> {hostel.totalRooms}</div>
                    <div><span className="font-medium">Available:</span> {hostel.availableRooms}</div>
                    <div><span className="font-medium">Starting Price:</span> ₵{hostel.startingPrice}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hostel Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter hostel name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location *</Label>
                    <Input id="edit-location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Enter location" required />
                    {locations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Quick select:</span>
                        {locations.slice(0, 5).map((loc) => (
                          <Button key={loc} type="button" variant={formData.location === loc ? "default" : "outline"} size="sm" className="text-xs h-6" onClick={() => handleInputChange('location', loc)}>{loc}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleMapsLink">Google Maps Link</Label>
                    <Input id="googleMapsLink" value={formData.googleMapsLink} onChange={(e) => handleInputChange('googleMapsLink', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-latitude" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Latitude
                    </Label>
                    <Input id="edit-latitude" type="number" step="any" value={formData.latitude} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="e.g. 5.6037" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-longitude" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Longitude
                    </Label>
                    <Input id="edit-longitude" type="number" step="any" value={formData.longitude} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="e.g. -0.1870" />
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
                      <label key={amenity.key} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${checked ? 'border-primary/50 bg-primary/8 shadow-sm' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleAmenity(amenity.key)} className="sr-only" />
                        <span className="text-2xl">{amenity.icon}</span>
                        <span className="text-xs font-medium text-center leading-tight">{amenity.label}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Manager Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Manager Name *</Label>
                    <Input id="managerName" value={formData.managerName} onChange={(e) => handleInputChange('managerName', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerPhone">Phone Number</Label>
                    <Input id="managerPhone" value={formData.managerPhone} onChange={(e) => handleInputChange('managerPhone', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerEmail">Email Address</Label>
                    <Input id="managerEmail" type="email" value={formData.managerEmail} onChange={(e) => handleInputChange('managerEmail', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <Input type="number" value={roomType.pricePerStudent} onChange={(e) => handleRoomTypeChange(index, 'pricePerStudent', parseInt(e.target.value) || 0)} min="0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Available Rooms</Label>
                      <Input type="number" value={roomType.availableRooms} onChange={(e) => handleRoomTypeChange(index, 'availableRooms', parseInt(e.target.value) || 0)} min="0" />
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

            <Card>
              <CardHeader><CardTitle className="text-lg">Update Images</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="images">Upload New Images (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input id="images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="flex-1" />
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Upload className="h-4 w-4 mr-2" />
                      {images ? `${images.length} new files selected` : 'No new files selected'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Update Hostel</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};