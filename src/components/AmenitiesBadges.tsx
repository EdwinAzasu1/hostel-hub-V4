import { AMENITY_OPTIONS } from '@/types/hostel';

interface AmenitiesBadgesProps {
  amenities?: string[];
  limit?: number;
  size?: 'sm' | 'md';
}

export const AmenitiesBadges = ({ amenities = [], limit, size = 'md' }: AmenitiesBadgesProps) => {
  if (!amenities || amenities.length === 0) return null;

  const displayed = limit ? amenities.slice(0, limit) : amenities;
  const remaining = limit ? Math.max(0, amenities.length - limit) : 0;

  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayed.map((key) => {
        const amenity = AMENITY_OPTIONS.find(a => a.key === key);
        if (!amenity) return null;
        return (
          <span
            key={key}
            className={`inline-flex items-center ${sizeClass} rounded-full bg-primary/8 border border-primary/20 text-primary font-medium`}
            title={amenity.label}
          >
            <span>{amenity.icon}</span>
            <span>{amenity.label}</span>
          </span>
        );
      })}
      {remaining > 0 && (
        <span className={`inline-flex items-center ${sizeClass} rounded-full bg-muted border border-border text-muted-foreground font-medium`}>
          +{remaining} more
        </span>
      )}
    </div>
  );
};
