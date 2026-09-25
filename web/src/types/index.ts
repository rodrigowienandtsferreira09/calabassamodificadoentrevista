export type UserRole = 'BUYER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  document?: string;
  phoneNumber?: string | null;
  role: UserRole;
  createdAt: string;
}

export type ProductItemType = 'COVERAGE' | 'HORSE' | 'APPAREL';

export interface CoverageProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  photos?: string[];
  isActive: boolean;
}

export interface HorseProduct {
  id: string;
  name: string;
  breed: string;
  sire: string;
  dam: string;
  description?: string | null;
  photos: string[];
  price: number;
  isActive: boolean;
}

export interface ApparelProduct {
  id: string;
  type: 'SHIRT' | 'CAP';
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  photos?: string[];
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  isActive: boolean;
}

export interface ProductsResponse {
  coverage: CoverageProduct[];
  horses: HorseProduct[];
  apparel: ApparelProduct[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  order?: number;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  itemType: ProductItemType;
  quantity: number;
  unitPrice: number;
  product: { id: string | null; name: string; imageUrl: string | null };
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  carrier: string | null;
  trackingCode: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  recipientName: string;
  recipientPhone: string;
  recipientDocument: string | null;
  deliveryZipCode: string | null;
  deliveryStreet: string | null;
  deliveryNumber: string | null;
  deliveryComplement: string | null;
  deliveryNeighborhood: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  shippingService: string | null;
  shippingAmount: number;
  shippingEstimatedDays: number | null;
  items: OrderItem[];
  buyer?: { id: string; fullName: string; phoneNumber: string | null; email: string };
}

export interface AuthResponse {
  message: string;
  user?: User;
  token?: string;
  expiresIn?: number;
}
