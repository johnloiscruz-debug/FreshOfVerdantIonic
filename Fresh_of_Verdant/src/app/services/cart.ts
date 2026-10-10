import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of } from 'rxjs';
import { CartItem, Product } from '../models/product';
import { ApiCartItem, ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);
  loading = false;
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

    this.api.cart().pipe(
      map((rows) => {
        if (!Array.isArray(rows)) {
          throw new Error('The cart endpoint returned an unexpected response. Expected a JSON array.');
        }
        return rows.map((row) => this.toCartItem(row));
      }),
      catchError((error: unknown) => {
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
    const existing = this.items().find((item) => item.id === product.id);
    if (existing) {
      this.change(existing.id, qty);
    } else {
      this.items.update((list) => [...list, { id: product.id, name: product.name, price: product.price, unit: product.unit, qty }]);
    }
  }

  change(id: number, delta: number) {
    this.items.update((list) => list.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  }

  remove(id: number) {
    this.items.update((list) => list.filter((item) => item.id !== id));
  }
}