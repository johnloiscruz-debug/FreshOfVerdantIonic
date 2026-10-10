import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CartItem, Product } from '../models/product';
import { ApiCartItem, ApiService } from './api';

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
    this.api.cart().subscribe({
      next: (rows) => {
        this.user = rows.user;
        this.items.set(rows.items.map((row) => ({
          id: Number(row.product_id),
          name: row.product_name ?? 'Unavailable product',
          price: Number(row.price ?? 0),
          unit: row.unit ?? '',
          qty: Number(row.quantity),
        })));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => this.handleError(error, 'Could not load your saved cart.'),
    });
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
    const item = {
      id: Number(row.product_id),
      name: row.product_name ?? 'Unavailable product',
      price: Number(row.price ?? 0),
      unit: row.unit ?? '',
      qty: Number(row.quantity),
    };
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
