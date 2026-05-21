export interface RoomType {
  id: string;
  type: 'Single (1-in-1)' | 'Double (2-in-1)' | 'Quad (4-in-1)';
  pricePerStudent: number;
  availableRooms: number;
}

export const AMENITY_OPTIONS = [
  { key: 'wifi',       label: 'WiFi',           icon: '📶' },
  { key: 'power',      label: '24/7 Power',      icon: '⚡' },
  { key: 'water',      label: 'Borehole Water',  icon: '💧' },
  { key: 'kitchen',   label: 'Kitchen',          icon: '🍳' },
  { key: 'security',  label: 'Security',         icon: '🔐' },
  { key: 'laundry',   label: 'Laundry',          icon: '🫧' },
  { key: 'parking',   label: 'Parking',          icon: '🚗' },
  { key: 'study',     label: 'Study Room',       icon: '📚' },
  { key: 'cctv',      label: 'CCTV',             icon: '📷' },
  { key: 'ac',        label: 'Air Conditioning', icon: '❄️' },
] as const;

export type AmenityKey = typeof AMENITY_OPTIONS[number]['key'];

export interface Hostel {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  googleMapsLink?: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  images: string[];
  roomTypes: RoomType[];
  totalRooms: number;
  startingPrice: number;
  availableRooms: number;
  amenities?: string[];
  latitude?: number | null;
  longitude?: number | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterOptions {
  location: string;
  minPrice: number;
  maxPrice: number;
  roomTypes: string[];
  searchQuery: string;
}