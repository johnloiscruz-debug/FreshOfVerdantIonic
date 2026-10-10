import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class CartService {
  // signal = a value that updates the screen automatically when it changes
  items = signal<CartItem[]>([
    { id: 101, name: 'Organic Roma Tomatoes', price: 68, unit: 'pack · 500 g', qty: 2 },
    { id: 102, name: 'Highland Lettuce', price: 82, unit: 'head · 1 head', qty: 1 },
    { id: 103, name: 'Sweet Saba Bananas', price: 95, unit: 'kg · 1 kg', qty: 1 },
    { id: 104, name: 'Native Carrots', price: 74, unit: 'pack · 500 g', qty: 2 },
  ]);

  deliveryFee = 49;
  savings = 24; // placeholder until you have real discounts

  count = computed(() => this.items().length);
  subtotal = computed(() => this.items().reduce((sum, i) => sum + i.price * i.qty, 0));
  tax = computed(() => Math.round(this.subtotal() * 0.04));
  total = computed(() => this.subtotal() + this.deliveryFee + this.tax());

  add(product: Product, qty = 1) {
    const existing = this.items().find((i) => i.id === product.id);
    if (existing) {
      this.change(existing.id, qty);
    } else {
      this.items.update((list) => [
        ...list,
        { id: product.id, name: product.name, price: product.price, unit: product.unit, qty },
      ]);
    }
  }

  change(id: number, delta: number) {
    this.items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    );
  }

  remove(id: number) {
    this.items.update((list) => list.filter((i) => i.id !== id));
  }
}