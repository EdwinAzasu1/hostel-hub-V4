import { MapPin, Users, Banknote, Building2, ArrowRight, Eye, BedDouble, GitCompare } from 'lucide-react';
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
  'Single (1-in-1)': 'bg-primary/15 text-primary border-primary/25',
  'Double (2-in-1)': 'bg-accent/15 text-accent border-accent/25',
  'Quad (4-in-1)':   'bg-success/15 text-success border-success/25',
};

export const HostelCard = ({ hostel, onViewDetails, index = 0, isSelected = false, onToggleCompare, compareDisabled = false }: HostelCardProps) => {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl opacity-0 animate-fade-in-up transition-all duration-500 hover:-translate-y-3"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      {/* Glass card body */}
      <div className="glass-card rounded-3xl h-full flex flex-col overflow-hidden">

        {/* Gradient border ring on hover */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            padding: '1.5px',
            background: 'linear-gradient(135deg, hsl(252 87% 62% / 0.7), hsl(336 88% 62% / 0.5))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Image Section */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl flex-shrink-0">
          {hostel.images && hostel.images.length > 0 ? (
            <img
              src={hostel.images[0]}
              alt={hostel.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary-glow/20 to-accent/25 flex items-center justify-center">
              <Building2 className="h-14 w-14 text-muted-foreground/40" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Compare Toggle */}
          {onToggleCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(hostel.id); }}
              disabled={compareDisabled && !isSelected}
              title={isSelected ? 'Remove from comparison' : compareDisabled ? 'Max 3 hostels' : 'Compare'}
              className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg border transition-all duration-300 ${
                isSelected
                  ? 'bg-primary/90 text-primary-foreground border-primary/60 shadow-[0_0_16px_hsl(var(--primary)/0.5)]'
                  : compareDisabled
                  ? 'bg-black/30 text-white/50 border-white/15 cursor-not-allowed'
                  : 'bg-white/15 text-white border-white/30 hover:bg-white/28 hover:border-white/50'
              }`}
            >
              <GitCompare className="h-3 w-3" />
              {isSelected ? 'Selected' : 'Compare'}
            </button>
          )}

          {/* Available Rooms Badge */}
          <div className="absolute top-3 right-3">
            <div className={`px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold shadow-lg border ${
              hostel.availableRooms > 0
                ? 'bg-success/85 text-success-foreground border-success/40 shadow-[0_0_12px_hsl(var(--success)/0.4)]'
                : 'bg-black/40 text-white/70 border-white/20'
            }`}>
              {hostel.availableRooms > 0 ? `${hostel.availableRooms} left` : 'Full'}
            </div>
          </div>

          {/* Price Chip */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/90 dark:bg-black/60 shadow-lg border border-white/60 dark:border-white/15">
              <Banknote className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">₵{hostel.startingPrice.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/yr</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-3.5 flex-1 flex flex-col">
          {/* Title & Location */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {hostel.name}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{hostel.location}</span>
            </div>
          </div>

          {/* Rating */}
          <HostelRatingBadge hostelId={hostel.id} />

          {/* Room Type Chips */}
          {hostel.roomTypes && hostel.roomTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hostel.roomTypes.map((room) => (
                <span
                  key={room.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${roomTypeColors[room.type] || 'bg-muted/60 text-muted-foreground border-border'}`}
                >
                  <BedDouble className="h-3 w-3" />
                  {room.type.split(' (')[0]}
                </span>
              ))}
            </div>
          )}

          {/* Amenities */}
          {hostel.amenities && hostel.amenities.length > 0 && (
            <AmenitiesBadges amenities={hostel.amenities} limit={4} size="sm" />
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {hostel.description}
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-3 pt-0.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle text-sm border">
              <Users className="h-4 w-4 text-primary/70" />
              <span className="font-semibold text-foreground">{hostel.totalRooms}</span>
              <span className="text-muted-foreground text-xs">rooms</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onViewDetails(hostel.id)}
            className="w-full h-11 rounded-2xl mt-1 shine-effect ripple-on-click"
          >
            <Eye className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            View Details
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};