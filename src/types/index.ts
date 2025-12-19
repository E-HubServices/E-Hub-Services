// Core types for the e-Sevai platform

export type UserRole = "customer" | "shop_owner" | "admin";

export type ServiceRequestStatus = 
  | "PENDING" 
  | "PAYMENT_PENDING"
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "CANCELLED";

export type PaymentStatus = 
  | "CREATED" 
  | "PAID" 
  | "FAILED" 
  | "REFUNDED";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  verified: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  serviceId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  shopOwnerId?: string;
  serviceId: string;
  paymentId?: string;
  status: ServiceRequestStatus;
  inputFiles: string[];
  outputFile?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  message: string;
  attachments: string[];
  createdAt: Date;
}

// Cart item for multi-service selection
export interface CartItem {
  serviceId: string;
  serviceName: string;
  price: number;
}

// For Razorpay checkout
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
