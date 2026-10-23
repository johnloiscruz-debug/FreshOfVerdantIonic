import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { TrackedOrder } from './order-history';

export interface CreateOrderRequest {
  items: Array<{ id: number; qty: number }>;
  address: string;
  payment: string;
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
  created_at?: string;
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

export interface ComplaintSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  assetUrl(path: string | null): string | undefined {
    if (!path) return undefined;
    if (/^(?:https?:)?\/\//i.test(path)) return path;

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

  register(details: { fullName: string; email: string; password: string; phoneNumber?: string }) {
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
}
