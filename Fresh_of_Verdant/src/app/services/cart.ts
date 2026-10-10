import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of } from 'rxjs';
import { CartItem, Product } from '../models/product';
import { ApiCart, ApiCartItem, ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);
  user: { fullName: string; email: string } | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  deliveryFee = 49;
  savings = 0;

  count = computed(() => this.items().reduce((sum, item) => sum + item.qty, 0));
  subtotal = computed(() => this.items().reduce((sum, item) => sum + item.price * item.qty, 0));
  tax = computed(() => Math.round(this.subtotal() * 0.04));
  total = computed(() => this.subtotal() + this.deliveryFee + this.tax());

  constructor(private api: ApiService) {}

  load() {
    this.loading = true;
    this.error = null;
    this.user = null;
    this.items.set([]);

    this.api.cart().pipe(
      map((response: ApiCart) => {
        if (!response || !Array.isArray(response.items)) {
          throw new Error('The cart endpoint returned an unexpected response. Expected a cart with an items array.');
        }
        this.user = response.user ?? null;
        return response.items.map((row) => this.toCartItem(row));
      }),
      catchError((error: unknown) => {
        this.user = null;
        this.items.set([]);
        this.error = this.getLoadError(error);
        return of([] as CartItem[]);
      }),
      finalize(() => {
        this.loading = false;
      }),
    ).subscribe((items) => this.items.set(items));
  }

  private toCartItem(row: ApiCartItem): CartItem {
    return {
      id: Number(row.product_id),
      name: row.product_name ?? 'Unavailable product',
      price: Number(row.price ?? 0),
      unit: row.unit ?? '',
      qty: Number(row.quantity),
      image: this.api.productImageUrl(row.image_url),
    };
  }

  private getLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'Sign in to view your saved cart.';
      }
      if (error.status === 0) {
        return 'Cannot reach the backend. Check that it is running on port 3000.';
      }
      if (error.status >= 500) {
        return 'Could not load your saved cart. Check the backend log and database connection.';
      }
      const detail = error.error?.error;
      return typeof detail === 'string' ? detail : `Could not load your saved cart (HTTP ${error.status}).`;
    }

    return error instanceof Error ? error.message : 'Could not load your saved cart.';
  }

  add(product: Product, qty = 1) {
    this.saving = true;
    this.error = null;
    this.api.addCartItem(product.id, qty).subscribe({
      next: (row) => {
        this.upsert(row);
        this.saving = false;
      },
      error: (error: HttpErrorResponse) => this.handleError(error, 'Could not add this product to your cart.'),
    });
  }

  change(id: number, delta: number) {
    const item = this.items().find((entry) => entry.id === id);
    if (!item) return;
    const quantity = Math.max(1, item.qty + delta);
    if (quantity === item.qty) return;

    this.saving = true;
    this.error = null;
    this.api.setCartItemQuantity(id, quantity).subscribe({
      next: (row) => {
        this.upsert(row);
        this.saving = false;
      },
      error: (error: HttpErrorResponse) => this.handleError(error, 'Could not update this cart item.'),
    });
  }

  remove(id: number) {
    this.saving = true;
    this.error = null;
    this.api.removeCartItem(id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((item) => item.id !== id));
        this.saving = false;
      },
      error: (error: HttpErrorResponse) => this.handleError(error, 'Could not remove this cart item.'),
    });
  }

  private upsert(row: ApiCartItem) {
    const item = this.toCartItem(row);
    this.items.update((list) => list.some((entry) => entry.id === item.id)
      ? list.map((entry) => entry.id === item.id ? item : entry)
      : [...list, item]);
  }

  private handleError(error: HttpErrorResponse, fallback: string) {
    if (error.status === 401 || error.status === 403) {
      this.user = null;
      this.items.set([]);
    }
    this.error = error.status === 401 || error.status === 403
      ? 'Sign in to view and update your saved cart.'
      : error.status === 0
        ? 'Cannot reach the backend. Check that it is running on port 3000.'
        : error.error?.error ?? fallback;
    this.loading = false;
    this.saving = false;
  }
}
