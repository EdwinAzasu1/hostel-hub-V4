import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Users, DollarSign, ExternalLink, ChevronLeft, ChevronRight, Navigation, MessageCircle } from 'lucide-react';
import { Hostel } from '@/types/hostel';
import { HostelReviews } from './HostelReviews';
import { AmenitiesBadges } from './AmenitiesBadges';

interface HostelDetailsModalProps {
  hostel: Hostel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatWhatsApp = (phone: string) => {
  // Remove spaces, dashes, parentheses, leading + sign
  let clean = phone.replace(/[\s\-\(\)\+]/g, '');
  // If starts with 0 and is Ghanaian, replace with 233
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '233' + clean.slice(1);
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent("Hello, I'm interested in your hostel listed on CU Hostel Finder. Could you please share more details?")}`;
};

export const HostelDetailsModal = ({ hostel, open, onOpenChange }: HostelDetailsModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);

  const images = hostel?.images || [];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex !== null) {
      setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
    }
  }, [currentImageIndex, images.length]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex !== null) {
      setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
    }
  }, [currentImageIndex, images.length]);

  useEffect(() => {
    if (currentImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
      } else if (e.key === 'Escape') {
        setCurrentImageIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, images.length]);

  if (!hostel) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{hostel.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Images */}
            {hostel.images && hostel.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hostel.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${hostel.name} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{hostel.description}</p>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{hostel.address}</span>
              </div>

              {/* Google Maps Embed */}
              {(() => {
                // Build the embed src: prefer lat/lng, fall back to address string
                const query = hostel.latitude && hostel.longitude
                  ? `${hostel.latitude},${hostel.longitude}`
                  : encodeURIComponent(hostel.address || hostel.location);
                const embedSrc = `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
                const openUrl = hostel.googleMapsLink
                  || (hostel.latitude && hostel.longitude
                    ? `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hostel.address || hostel.location)}`);

                return (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-border shadow-sm">
                    {/* Real Google Maps iframe */}
                    <div className="relative h-64 bg-muted">
                      <iframe
                        title={`Map showing location of ${hostel.name}`}
                        src={embedSrc}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                    {/* Directions footer bar */}
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between px-4 py-3 bg-card hover:bg-primary/5 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">Get Directions</span>
                        <span className="text-muted-foreground text-xs hidden sm:inline">· Open in Google Maps</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Amenities */}
            {hostel.amenities && hostel.amenities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                  <AmenitiesBadges amenities={hostel.amenities} />
                </div>
              </>
            )}

            <Separator />

            {/* Room Types and Pricing */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Room Types & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hostel.roomTypes.map((room) => (
                  <div key={room.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{room.type}</h4>
                      <Badge variant={room.availableRooms > 0 ? "default" : "secondary"}>
                        {room.availableRooms} Available
                      </Badge>
                    </div>
                    <div className="flex items-center text-accent font-semibold">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ₵{room.pricePerStudent}/student
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">₵{hostel.startingPrice}</div>
                <div className="text-sm text-muted-foreground">Starting from</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center text-2xl font-bold">
                  <Users className="h-6 w-6 mr-1" />
                  {hostel.totalRooms}
                </div>
                <div className="text-sm text-muted-foreground">Total Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{hostel.availableRooms}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>

            <Separator />

            {/* Manager Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-24 text-sm text-muted-foreground">Manager:</div>
                  <div className="font-medium">{hostel.managerName}</div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`tel:${hostel.managerPhone}`} className="text-accent hover:underline">{hostel.managerPhone}</a>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${hostel.managerEmail}`} className="text-accent hover:underline">{hostel.managerEmail}</a>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <HostelReviews hostelId={hostel.id} />

            <Separator />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground"
                onClick={() => window.open(`tel:${hostel.managerPhone}`, '_self')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Manager
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => window.open(`mailto:${hostel.managerEmail}`, '_self')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md font-semibold"
                onClick={() => window.open(formatWhatsApp(hostel.managerPhone), '_blank')}
                title={`Chat with ${hostel.managerName} on WhatsApp`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {currentImageIndex !== null && images[currentImageIndex] && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setCurrentImageIndex(null)}>
          {hasMultipleImages && (
            <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1); }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <img src={images[currentImageIndex]} alt={`${hostel.name} - Image ${currentImageIndex + 1}`} className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-pointer" />
          {hasMultipleImages && (
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1); }}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm pointer-events-none">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};
