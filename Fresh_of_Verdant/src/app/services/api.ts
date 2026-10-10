import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  created_at: string;
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

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  products(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(`${this.baseUrl}/fetchProducts`);
  }

  login(email: string, password: string) {
    return this.http.post<{ role: string }>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true });
  }

  register(details: { fullName: string; email: string; password: string; phoneNumber?: string }) {
    return this.http.post<{ login: string }>(`${this.baseUrl}/register`, details, { withCredentials: true });
  }

  cart(): Observable<ApiCartItem[]> {
    return this.http.get<ApiCartItem[]>(`${this.baseUrl}/cart`, { withCredentials: true });
  }
}
