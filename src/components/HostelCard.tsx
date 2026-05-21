import { MapPin, Users, Banknote, Building2, ArrowRight, Eye, BedDouble, GitCompare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hostel } from '@/types/hostel';
import { HostelRatingBadge } from './HostelReviews';
import { AmenitiesBadges } from './AmenitiesBadges';

interface HostelCardProps {
  hostel: Hostel;
  onViewDetails: (hostelId: string) => void;
  index?: number;
  isSelected?: boolean;
  onToggleCompare?: (hostelId: string) => void;
  compareDisabled?: boolean;
}

const roomTypeColors: Record<string, string> = {
  'Single (1-in-1)': 'bg-primary/10 text-primary border-primary/20',
  'Double (2-in-1)': 'bg-accent/10 text-accent border-accent/20',
  'Quad (4-in-1)': 'bg-success/10 text-success border-success/20',
};

export const HostelCard = ({ hostel, onViewDetails, index = 0, isSelected = false, onToggleCompare, compareDisabled = false }: HostelCardProps) => {
  return (
    <Card
      className="group relative overflow-hidden rounded-2xl border-0 bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      {/* Image Section */}
      <div className="relative h-52 overflow-hidden">
        {hostel.images && hostel.images.length > 0 ? (
          <img
            src={hostel.images[0]}
            alt={hostel.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Building2 className="h-14 w-14 text-muted-foreground/50" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Compare Toggle */}
        {onToggleCompare && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(hostel.id); }}
            disabled={compareDisabled && !isSelected}
            title={isSelected ? 'Remove from comparison' : compareDisabled ? 'Max 3 hostels for comparison' : 'Add to comparison'}
            className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg transition-all duration-200 ${
              isSelected
                ? 'bg-primary text-primary-foreground border border-primary/50'
                : compareDisabled
                ? 'bg-muted/60 text-muted-foreground cursor-not-allowed'
                : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
            }`}
          >
            <GitCompare className="h-3 w-3" />
            {isSelected ? 'Selected' : 'Compare'}
          </button>
        )}

        {/* Available Rooms Badge */}
        <div className="absolute top-3 right-3">
          <div className={`px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold shadow-lg ${hostel.availableRooms > 0 ? 'bg-success/90 text-success-foreground' : 'bg-muted/80 text-muted-foreground'}`}>
            {hostel.availableRooms > 0 ? `${hostel.availableRooms} rooms left` : 'Full'}
          </div>
        </div>

        {/* Price on Image */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-lg">
            <Banknote className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">₵{hostel.startingPrice.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/year</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-3.5">
        {/* Title & Location */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {hostel.name}
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary/70 flex-shrink-0" />
            <span className="text-sm line-clamp-1">{hostel.location}</span>
          </div>
        </div>

        {/* Rating */}
        <HostelRatingBadge hostelId={hostel.id} />

        {/* Room Type Chips */}
        {hostel.roomTypes && hostel.roomTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hostel.roomTypes.map((room) => (
              <span key={room.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roomTypeColors[room.type] || 'bg-muted text-muted-foreground border-border'}`}>
                <BedDouble className="h-3 w-3" />
                {room.type.split(' (')[0]}
              </span>
            ))}
          </div>
        )}

        {/* Amenities (top 4) */}
        {hostel.amenities && hostel.amenities.length > 0 && (
          <AmenitiesBadges amenities={hostel.amenities} limit={4} size="sm" />
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {hostel.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 text-sm">
            <Users className="h-4 w-4 text-primary/70" />
            <span className="font-medium text-foreground">{hostel.totalRooms}</span>
            <span className="text-muted-foreground text-xs">total rooms</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onViewDetails(hostel.id)}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground font-semibold shadow-glow/30 hover:shadow-glow transition-all duration-300 group/btn shine-effect"
        >
          <Eye className="h-4 w-4 mr-2 transition-transform duration-300 group-hover/btn:scale-110" />
          View Details
          <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
};