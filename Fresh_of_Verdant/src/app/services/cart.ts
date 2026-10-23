import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, firstValueFrom, map, of, tap, timeout, TimeoutError } from 'rxjs';
import { CartItem, Product } from '../models/product';
import { ApiCart, ApiCartItem, ApiService } from './api';
import { AuthService } from './auth';
import { Router } from '@angular/router';
import { OrderHistoryService } from './order-history';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>(this.restoreItems());
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

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private orderHistory: OrderHistoryService, private toastController: ToastController) {}

  load() {
    this.loading = true;
    this.error = null;
    this.api.cart().pipe(
      timeout({ first: 10000 }),
      map((response: ApiCart) => {
        if (!response || !Array.isArray(response.items)) {
          throw new Error('The cart endpoint returned an unexpected response. Expected a cart with an items array.');
        }
        this.user = response.user ?? null;
        return response.items.map((row) => this.toCartItem(row));
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.user = null;
          this.items.set([]);
          this.saveItems([]);
          this.auth.signOut();
          this.orderHistory.clearForSignOut();
          void this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
          this.error = 'Your session expired. Sign in to load your account cart.';
          return of([] as CartItem[]);
        }
        this.error = this.items().length
          ? 'Could not connect to sync your cart. Showing the saved items on this device.'
          : this.getLoadError(error);
        // A failed refresh must leave the device copy intact. Returning an empty
        // array here made the subscription below erase items already in the cart.
        return of(this.items());
      }),
      finalize(() => {
        this.loading = false;
      }),
    ).subscribe((items) => { this.items.set(items); this.saveItems(items); });
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
    if (error instanceof TimeoutError) return 'The cart service did not respond. Check your connection and try again.';
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

  async add(product: Product, qty = 1): Promise<'added' | 'saved' | 'rejected' | 'unauthenticated'> {
    if (!this.auth.isAuthenticated) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return 'unauthenticated';
    }

    if (product.stockQuantity !== undefined && product.stockQuantity < qty) {
      const message = product.stockQuantity <= 0 ? `${product.name} is out of stock.` : `Only ${product.stockQuantity} ${product.unit} of ${product.name} are available.`;
      this.error = message;
      await this.notify(message, 'warning');
      return 'rejected';
    }

    this.saving = true;
    this.error = null;
    const previousItems = this.items();
    const current = this.items().find((item) => item.id === product.id);
    const localItem: CartItem = { id: product.id, name: product.name, price: product.price, unit: product.unit, qty: (current?.qty ?? 0) + qty, image: product.image };
    this.upsertLocal(localItem);
    try {
      const row = await firstValueFrom(this.api.addCartItem(product.id, qty).pipe(timeout({ first: 10000 })));
      if (!row) throw new Error('The cart service did not confirm the added product.');
      this.upsert(row);
      this.error = null;
      await this.notify('Added to My Cart', 'success');
      return 'added';
    } catch (error) {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        this.handleOfflineError(error, 'Your session expired. Sign in again to add products to your cart.');
        return 'unauthenticated';
      }

      if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
        this.items.set(previousItems);
        this.saveItems(previousItems);
        const message = typeof error.error?.error === 'string' ? error.error.error : 'This product could not be added to your cart.';
        this.error = message;
        await this.notify(message, 'warning');
        return 'rejected';
      }

      this.error = error instanceof HttpErrorResponse && error.status === 0
        ? 'Could not connect to sync your cart. The item is saved on this device.'
        : 'The cart service could not confirm this item. It is saved on this device.';
      await this.notify('Saved on this device. Reconnect to sync your cart.', 'warning');
      return 'saved';
    } finally {
      this.saving = false;
    }
  }

  private async notify(message: string, color: 'success' | 'warning') {
    const toast = await this.toastController.create({ message, duration: 2200, position: 'top', color });
    await toast.present();
  }

  clearForSignOut() {
    this.items.set([]);
    this.saveItems([]);
  }

  clearAfterCheckout() {
    return this.api.clearCart().pipe(tap(() => {
      this.items.set([]);
      this.saveItems([]);
      this.error = null;
    }));
  }

  clearLocalAfterCheckout() {
    this.items.set([]);
    this.saveItems([]);
    this.error = null;
  }

  change(id: number, delta: number) {
    const item = this.items().find((entry) => entry.id === id);
    if (!item) return;
    const quantity = Math.max(1, item.qty + delta);
    if (quantity === item.qty) return;

    this.saving = true;
    this.error = null;
    this.upsertLocal({ ...item, qty: quantity });
    this.api.setCartItemQuantity(id, quantity).pipe(timeout({ first: 10000 })).subscribe({
      next: (row) => {
        this.upsert(row);
        this.saving = false;
      },
      error: (error: HttpErrorResponse) => this.handleOfflineError(error, 'Change saved on this device. The cart service is offline.'),
    });
  }

  remove(id: number) {
    this.saving = true;
    this.error = null;
    this.items.update((list) => list.filter((item) => item.id !== id));
    this.saveItems(this.items());
    this.api.removeCartItem(id).pipe(timeout({ first: 10000 })).subscribe({
      next: () => {
        this.items.update((list) => list.filter((item) => item.id !== id));
        this.saving = false;
      },
      error: (error: HttpErrorResponse) => this.handleOfflineError(error, 'Removal saved on this device. The cart service is offline.'),
    });
  }

  private upsert(row: ApiCartItem) {
    const item = this.toCartItem(row);
    this.upsertLocal(item);
  }

  private upsertLocal(item: CartItem) {
    this.items.update((list) => list.some((entry) => entry.id === item.id)
      ? list.map((entry) => entry.id === item.id ? item : entry)
      : [...list, item]);
    this.saveItems(this.items());
  }

  private restoreItems(): CartItem[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      return JSON.parse(localStorage.getItem('fv-cart-items') ?? '[]') as CartItem[];
    }
    catch { return []; }
  }

  private saveItems(items: CartItem[]) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('fv-cart-items', JSON.stringify(items));
  }

  private handleOfflineError(error: HttpErrorResponse, fallback: string) {
    if (error.status === 401 || error.status === 403) {
      this.user = null;
      this.auth.signOut();
      this.orderHistory.clearForSignOut();
      this.items.set([]);
      this.saveItems([]);
      this.error = 'Your session expired. Sign in to update your account cart.';
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
    } else {
      this.error = error.status === 0
        ? 'Cannot reach the cart service. Your changes are saved on this device.'
        : fallback;
    }
    this.saving = false;
  }

}
