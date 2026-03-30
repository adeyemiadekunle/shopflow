// User Types
export type UserRole = "buyer" | "seller" | "admin"

export interface User {
  id: string
  phone: string
  email?: string
  displayName: string
  avatarUrl?: string
  role: UserRole
  isVerified: boolean
  createdAt: Date
}

export interface Seller extends User {
  role: "seller"
  storeName: string
  storeSlug: string
  storeDescription?: string
  storeLogo?: string
  storeBanner?: string
  businessAddress: Address
  bankDetails?: BankDetails
  kycStatus: "pending" | "submitted" | "verified" | "rejected"
  kycDocuments?: KYCDocuments
  rating: number
  totalSales: number
  totalOrders: number
  joinedAt: Date
}

export interface KYCDocuments {
  idType: "nin" | "drivers_license" | "voters_card" | "passport"
  idNumber: string
  idImageUrl?: string
  cacNumber?: string
  cacImageUrl?: string
}

export interface BankDetails {
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
}

// Address Types
export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  street: string
  city: string
  state: string
  lga: string
  landmark?: string
  isDefault: boolean
}

// Product Types
export interface Product {
  id: string
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  subcategory?: string
  variants?: ProductVariant[]
  stock: number
  isActive: boolean
  rating: number
  reviewCount: number
  createdAt: Date
}

export interface ProductVariant {
  id: string
  name: string
  options: string[]
  priceAdjustment?: number
  stock: number
}

// Cart Types
export interface CartItem {
  id: string
  product: Product
  quantity: number
  selectedVariants?: Record<string, string>
  addedAt: Date
}

// Order Types
export type OrderStatus = 
  | "pending_payment"
  | "payment_confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund_requested"
  | "refunded"

export interface Order {
  id: string
  orderNumber: string
  buyerId: string
  sellerId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  serviceFee: number
  total: number
  deliveryAddress: Address
  deliveryOption: DeliveryOption
  status: OrderStatus
  timeline: OrderTimelineEvent[]
  paymentReference?: string
  trackingNumber?: string
  estimatedDelivery?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  selectedVariants?: Record<string, string>
}

export interface OrderTimelineEvent {
  status: OrderStatus
  timestamp: Date
  note?: string
  actor?: "system" | "seller" | "buyer" | "delivery"
}

export interface DeliveryOption {
  id: string
  name: string
  carrier: string
  estimatedDays: string
  price: number
}

// Wallet Types
export interface Wallet {
  userId: string
  availableBalance: number
  pendingBalance: number
  totalEarnings: number
  transactions: WalletTransaction[]
}

export interface WalletTransaction {
  id: string
  type: "credit" | "debit" | "escrow_hold" | "escrow_release"
  amount: number
  description: string
  orderId?: string
  status: "pending" | "completed" | "failed"
  createdAt: Date
}

// Nigerian States and LGAs
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
] as const

export const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Globus Bank", code: "103" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
] as const

// Format helpers
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPhone(phone: string): string {
  // Format Nigerian phone number
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("234")) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}
