import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CartItem, Product } from '../models/product';
import { ApiService } from './api';

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
    this.api.cart().subscribe({
      next: (rows) => {
        this.items.set(rows.map((row) => ({
          id: Number(row.product_id),
          name: row.product_name ?? 'Unavailable product',
          price: Number(row.price ?? 0),
          unit: row.unit ?? '',
          qty: Number(row.quantity),
        })));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 401 || error.status === 403
          ? 'Sign in to view your saved cart.'
          : error.status === 0
            ? 'Cannot reach the backend. Check that it is running on port 3000.'
            : error.error?.error ?? 'Could not load your saved cart.';
        this.loading = false;
      },
    });
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
