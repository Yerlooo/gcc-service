export type ServiceUnit = 'UNIT' | 'POINT' | 'PACKAGE' | 'METER';

export type PropertyType = 'RUMAH' | 'APARTEMEN' | 'KANTOR' | 'RUKO' | 'LAINNYA';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'EWALLET' | 'MIDTRANS';

export interface ServiceVariant {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  sortOrder: number;
  isActive?: boolean;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  unit: ServiceUnit;
  durationMinutes: number;
  warrantyDays: number;
  isFeatured: boolean;
  sortOrder: number;
  variants: ServiceVariant[];
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder?: number;
  services: Service[];
}

export interface Testimonial {
  id: string;
  customerName: string;
  customerMeta: string | null;
  rating: number;
  content: string;
  createdAt: string;
  service: { name: string; slug: string } | null;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface SlotAvailability {
  id: string;
  label: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
  remaining: number;
  available: boolean;
  reason?: string;
}

export interface AvailabilityResponse {
  date: string;
  slots: SlotAvailability[];
}

export interface TrackHistoryEntry {
  status: BookingStatus;
  label: string;
  note: string | null;
  createdAt: string;
}

export interface TrackedBooking {
  code: string;
  status: BookingStatus;
  statusLabel: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  scheduledAt: string;
  slotLabel: string;
  createdAt: string;
  total: number;
  city: string;
  district: string;
  service: { name: string; slug: string };
  variant: { name: string } | null;
  technician: { name: string } | null;
  customer: {
    name: string;
    phone: string;
    address: string | null;
    postalCode: string | null;
  };
  notes: string | null;
  verified: boolean;
  history: TrackHistoryEntry[];
}

export interface CreatedBooking {
  id?: string;
  code: string;
  status: BookingStatus;
  statusLabel?: string;
  scheduledAt: string;
  slotLabel: string;
  total: number;
  customer: { name: string; phone: string };
  service: { name: string; slug?: string };
  variant: { name: string } | null;
}

export interface AdminCustomer {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  district: string;
  postalCode?: string | null;
}

export interface AdminBooking {
  id: string;
  code: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  source: 'WEBSITE' | 'WHATSAPP' | 'PHONE';
  scheduledAt: string;
  slotLabel: string;
  durationMinutes: number;
  propertyType: PropertyType;
  address: string;
  city: string;
  district: string;
  postalCode: string | null;
  notes: string | null;
  unitCount: number;
  basePrice: number;
  addOnTotal: number;
  discount: number;
  total: number;
  paymentRef: string | null;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: AdminCustomer;
  service: { id?: string; name: string; slug?: string };
  variant: { id?: string; name: string } | null;
  technician: { id: string; name: string } | null;
  history: Array<{
    id?: string;
    status: BookingStatus;
    note: string | null;
    createdAt: string;
    changedBy?: { name: string } | null;
  }>;
}

export interface Technician {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  isActive?: boolean;
  zone: string;
  specialties: string[];
  capacityPerDay: number;
  isAvailable: boolean;
  notes?: string | null;
  workload?: number | null;
  remaining?: number | null;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  isActive: boolean;
  isLowStock?: boolean;
}

export interface StockMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  note: string | null;
  createdAt: string;
  createdBy?: { name: string } | null;
  booking?: { code: string } | null;
}

export interface DashboardData {
  generatedAt: string;
  range: '7d' | '30d';
  kpis: {
    bookingsToday: number;
    pendingConfirmations: number;
    activeJobs: number;
    completedThisMonth: number;
    revenueThisMonth: number;
    slotCapacity: number;
  };
  todaySchedule: Array<{
    id: string;
    code: string;
    status: BookingStatus;
    statusLabel: string;
    paymentStatus: PaymentStatus;
    slot: string;
    scheduledAt: string;
    customer: { name: string; phone: string; district: string };
    service: string;
    variant: string | null;
    technician: string | null;
    total: number;
  }>;
  recentBookings: Array<{
    id: string;
    code: string;
    status: BookingStatus;
    statusLabel: string;
    paymentStatus: PaymentStatus;
    customer: string;
    service: string;
    technician: string | null;
    total: number;
    createdAt: string;
  }>;
  statusBreakdown: Array<{ status: BookingStatus; label: string; count: number }>;
  trend: Array<{ date: string; bookings: number; revenue: number }>;
  lowStock: Array<{
    id: string;
    sku: string;
    name: string;
    unit: string;
    quantity: number;
    minQuantity: number;
  }>;
  pendingTestimonials: number;
  latestTestimonials: Array<{
    id: string;
    customerName: string;
    rating: number;
    content: string;
    createdAt: string;
    service: { name: string } | null;
  }>;
  technicians: Array<{
    id: string;
    name: string;
    zone: string;
    isAvailable: boolean;
    workload: number;
    capacity: number;
  }>;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  district: string;
  serviceAreas: string[];
  hours: string;
  instagram: string;
}

export interface PaymentSettings {
  bankName: string;
  bankAccount: string;
  accountName: string;
  note: string;
}

export interface SiteSettings {
  business: BusinessSettings;
  payment: PaymentSettings;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIAN';
}
