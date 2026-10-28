import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import type { TrackedOrder } from './order-history';
import type { UserReview } from './reviews';

export interface CreateOrderRequest {
  items: Array<{ id: number; qty: number }>;
  address: string;
  street: string;
  barangay: string;
  city: string;
  zipCode: string;
  payment: string;
  deliveryDate: string;
  deliveryTime: string;
  cashTendered: number | null;
  totalChange: number | null;
  orderNotes: string;
  deliveryWindow: string;
  deliverySchedule: 'standard' | 'same-day';
  deliveryFee: number;
}

export interface ApiProduct {
  product_id: number;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  category: { category_id: number; category_name: string; description: string | null } | null;
}

export interface ApiCartItem {
  cart_id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  added_at: string;
  product_name: string | null;
  product_description: string | null;
  price: number | null;
  stock_quantity: number | null;
  unit: string | null;
  image_url: string | null;
}

export interface ApiCart {
  user: { fullName: string; email: string } | null;
  items: ApiCartItem[];
}

export interface ApiAccount {
  loggedIn: boolean;
  user: { userId: number; fullName: string; email: string; role: string };
}

export interface AdminOverview {
  orderCount: number;
  salesTotal: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  productCount: number;
  lowStockCount: number;
  customerCount: number;
  reviewCount: number;
  complaintCount: number;
}

export interface AdminDashboardData {
  overview: AdminOverview;
  orders: AdminOrder[];
  lowStock: Array<{ product_id: number; product_name: string; stock_quantity: number; unit: string }>;
}

export interface AdminProduct {
  product_id: number;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  unit: string;
  image_url: string | null;
  category_id: number | null;
  category_name?: string | null;
  is_active: boolean;
}

export interface AdminOrder {
  order_id: number;
  customer_name: string;
  order_status: string;
  total_amount: number;
  payment_method: string;
  placed_at: string;
  shipping_address: string;
}

export interface AdminCustomer {
  user_id: number;
  full_name: string;
  username: string;
  email: string;
  phone_number: string | null;
  account_status: string;
}

export interface AdminCategory {
  category_id: number;
  category_name: string;
  description: string | null;
}

export interface AdminCategoryCount {
  category_name: 'Fruits' | 'Vegetables' | 'Grains' | 'Others';
  product_count: number;
}

export interface AdminOrderDetail extends AdminOrder {
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  zip_code: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  order_notes: string | null;
  items: Array<{ product_id: number; product_name: string; quantity: number; unit_price: number; unit: string; image_url: string | null }>;
}

export interface AdminReport {
  summary: { order_count: number; sales_total: number };
  daily: Array<{ sale_date: string; order_count: number; sales_total: number }>;
  bestSellers: Array<{ product_id: number; product_name: string; units_sold: number; sales_total: number }>;
  lowStock: Array<{ product_id: number; product_name: string; stock_quantity: number; unit: string }>;
  reviews: Array<{ review_id: number; rating_stars: number; comment_text: string | null; created_at: string; author: string; product_name: string | null }>;
}

export interface AdminCustomerOrder {
  order_id: number;
  order_status: string;
  total_amount: number;
  placed_at: string;
}

export interface AdminComplaint {
  complaint_id: number;
  user_id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  resolution: string | null;
}

export interface ComplaintSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface UserComplaint {
  complaint_id: number;
  user_id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  resolution: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  readonly googleAuthUrl = `${this.baseUrl}/auth/google`;

  constructor(private http: HttpClient) {}

  assetUrl(path: string | null): string | undefined {
    if (!path) return undefined;
    if (/^(?:https?:)?\/\//i.test(path) || /^data:image\//i.test(path)) return path;

    const backendUrl = this.baseUrl.replace(/\/api\/?$/, '');
    return new URL(path, `${backendUrl}/`).toString();
  }

  products(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(`${this.baseUrl}/fetchProducts`);
  }

  productImageUrl(imageUrl: string | null): string | undefined {
    if (!imageUrl) {
      return undefined;
    }

    if (/^(?:https?:)?\/\//i.test(imageUrl) || /^data:image\//i.test(imageUrl)) {
      return imageUrl;
    }

    return new URL(imageUrl, new URL(this.baseUrl).origin).toString();
  }

  login(email: string, password: string) {
    return this.http.post<{ role: string; fullName?: string; name?: string; user?: ApiAccount['user'] }>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true });
  }

  register(details: { fullName: string; email: string; password: string; phoneNumber?: string; role?: 'Customer' | 'Admin'; adminCode?: string }) {
    return this.http.post<{ login: string; user?: ApiAccount['user'] }>(`${this.baseUrl}/register`, details, { withCredentials: true });
  }

  account() {
    return this.http.get<ApiAccount>(`${this.baseUrl}/isLoggedIn`, { withCredentials: true });
  }

  logout() {
    return this.http.post<{ logout: string }>(`${this.baseUrl}/logout`, {}, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true },
    );
  }

  cart(): Observable<ApiCart> {
    return this.http.get<ApiCart>(`${this.baseUrl}/cart`, { withCredentials: true });
  }

  addCartItem(productId: number, quantity: number): Observable<ApiCartItem> {
    return this.http.post<ApiCartItem>(
      `${this.baseUrl}/cart`,
      { product_id: productId, quantity },
      { withCredentials: true },
    );
  }

  setCartItemQuantity(productId: number, quantity: number): Observable<ApiCartItem> {
    return this.http.put<ApiCartItem>(
      `${this.baseUrl}/cart/${productId}`,
      { quantity },
      { withCredentials: true },
    );
  }

  removeCartItem(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cart/${productId}`, { withCredentials: true });
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cart`, { withCredentials: true });
  }

  orders(): Observable<TrackedOrder[]> {
    return this.http.get<TrackedOrder[]>(`${this.baseUrl}/orders`, { withCredentials: true });
  }

  createOrder(order: CreateOrderRequest): Observable<TrackedOrder> {
    return this.http.post<TrackedOrder>(`${this.baseUrl}/orders`, order, { withCredentials: true });
  }

  reviews(): Observable<UserReview[]> {
    return this.http.get<UserReview[]>(`${this.baseUrl}/reviews`);
  }

  myReviewCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/reviews/mine/count`, { withCredentials: true });
  }

  profileAvatar(): Observable<{ avatarUrl: string | null }> {
    return this.http.get<{ avatarUrl: string | null }>(`${this.baseUrl}/reviews/avatar`, { withCredentials: true });
  }

  saveProfileAvatar(avatarUrl: string): Observable<{ avatarUrl: string }> {
    return this.http.put<{ avatarUrl: string }>(`${this.baseUrl}/reviews/avatar`, { avatarUrl }, { withCredentials: true });
  }

  createReview(review: { author: string; rating: number; text: string; productId: number | null }): Observable<UserReview> {
    return this.http.post<UserReview>(`${this.baseUrl}/reviews`, review, { withCredentials: true });
  }

  requestOrderRefund(orderId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/orders/${encodeURIComponent(orderId)}/refund`, {}, { withCredentials: true });
  }

  wishlist(): Observable<{ product_id: number }[]> {
    return this.http.get<{ product_id: number }[]>(`${this.baseUrl}/wishlist`, { withCredentials: true });
  }

  saveWishlistItem(productId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/wishlist`, { product_id: productId }, { withCredentials: true });
  }

  removeWishlistItem(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wishlist/${productId}`, { withCredentials: true });
  }

  submitComplaint(details: ComplaintSubmission) {
    return this.http.post<{ complaintId: number; status: string }>(`${this.baseUrl}/complaint`, details, { withCredentials: true });
  }

  myComplaints(): Observable<UserComplaint[]> {
    return this.http.get<UserComplaint[]>(`${this.baseUrl}/complaint`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminOverview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(`${this.baseUrl}/admin/overview`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminDashboard(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(`${this.baseUrl}/admin/dashboard`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminProducts(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>(`${this.baseUrl}/admin/products`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  createAdminProduct(product: Omit<AdminProduct, 'product_id' | 'is_active' | 'category_name'>): Observable<{ productId: number }> {
    return this.http.post<{ productId: number }>(`${this.baseUrl}/admin/products`, { name: product.product_name, description: product.description, price: product.price, stockQuantity: product.stock_quantity, unit: product.unit, imageUrl: product.image_url, categoryId: product.category_id }, { withCredentials: true });
  }

  adminCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${this.baseUrl}/admin/categories`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminCategoryCounts(): Observable<AdminCategoryCount[]> {
    return this.http.get<AdminCategoryCount[]>(`${this.baseUrl}/admin/category-counts`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  updateAdminProduct(product: AdminProduct): Observable<{ saved: boolean }> {
    return this.http.patch<{ saved: boolean }>(`${this.baseUrl}/admin/products/${product.product_id}`, { name: product.product_name, description: product.description, price: product.price, stockQuantity: product.stock_quantity, unit: product.unit, imageUrl: product.image_url, categoryId: product.category_id, isActive: product.is_active }, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminOrders(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(`${this.baseUrl}/admin/orders`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminOrderDetail(orderId: number): Observable<AdminOrderDetail> {
    return this.http.get<AdminOrderDetail>(`${this.baseUrl}/admin/orders/${orderId}`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  updateAdminOrder(orderId: number, status: string): Observable<{ saved: boolean }> {
    return this.http.patch<{ saved: boolean }>(`${this.baseUrl}/admin/orders/${orderId}`, { status }, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminCustomers(): Observable<AdminCustomer[]> {
    return this.http.get<AdminCustomer[]>(`${this.baseUrl}/admin/customers`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  adminComplaints(): Observable<AdminComplaint[]> {
    return this.http.get<AdminComplaint[]>(`${this.baseUrl}/admin/complaints`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  createAdminComplaint(details: Omit<AdminComplaint, 'complaint_id' | 'user_id' | 'status' | 'resolution'>): Observable<{ complaintId: number }> {
    return this.http.post<{ complaintId: number }>(`${this.baseUrl}/admin/complaints`, details, { withCredentials: true });
  }

  updateAdminComplaint(complaint: AdminComplaint): Observable<{ saved: boolean }> {
    return this.http.patch<{ saved: boolean }>(`${this.baseUrl}/admin/complaints/${complaint.complaint_id}`, { name: complaint.name, email: complaint.email, subject: complaint.subject, message: complaint.message, status: complaint.status, resolution: complaint.resolution }, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  deleteAdminComplaint(complaintId: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/admin/complaints/${complaintId}`, { withCredentials: true });
  }

  adminCustomerOrders(userId: number): Observable<AdminCustomerOrder[]> {
    return this.http.get<AdminCustomerOrder[]>(`${this.baseUrl}/admin/customers/${userId}/orders`, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  updateAdminCustomer(userId: number, status: string): Observable<{ saved: boolean }> {
    return this.http.patch<{ saved: boolean }>(`${this.baseUrl}/admin/customers/${userId}`, { status }, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  createAdminCategory(name: string, description: string): Observable<{ categoryId: number }> {
    return this.http.post<{ categoryId: number }>(`${this.baseUrl}/admin/categories`, { name, description }, { withCredentials: true });
  }

  updateAdminCategory(category: AdminCategory): Observable<{ saved: boolean }> {
    return this.http.patch<{ saved: boolean }>(`${this.baseUrl}/admin/categories/${category.category_id}`, { name: category.category_name, description: category.description }, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  deleteAdminCategory(categoryId: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/admin/categories/${categoryId}`, { withCredentials: true });
  }

  adminReports(from?: string, to?: string): Observable<AdminReport> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<AdminReport>(`${this.baseUrl}/admin/reports`, { params, withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  updateAdminReview(reviewId: number, rating: number, comment: string): Observable<{ saved: boolean }> {
    return this.http.patch<{ saved: boolean }>(`${this.baseUrl}/admin/reviews/${reviewId}`, { rating, comment }, { withCredentials: true }).pipe(timeout({ first: 20000 }));
  }

  deleteAdminReview(reviewId: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/admin/reviews/${reviewId}`, { withCredentials: true });
  }
}
