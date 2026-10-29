import { computed, Injectable, signal } from '@angular/core';
import { CartItem } from '../models/product';
import { ApiService } from './api';
import { AuthService } from './auth';
import { catchError, of, tap } from 'rxjs';

export interface TrackedOrder {
  id: string;
  createdAt: string;
  claimedAt?: string | null;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  address: string;
  street?: string;
  barangay?: string;
  city?: string;
  zipCode?: string;
  payment: string;
  deliveryWindow: string;
  deliveryDate?: string;
  deliveryTime?: string;
  cashTendered?: number | null;
  totalChange?: number | null;
  orderNotes?: string;
  deliverySchedule?: 'standard' | 'same-day';
  refundRequested?: boolean;
}

export type OrderStatus = 'Confirmed' | 'Packed at Farm Hub' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

const ORDER_STAGE_DESCRIPTIONS: Array<{ status: OrderStatus; desc: string }> = [
  { status: 'Confirmed', desc: 'We received your order and reserved the produce.' },
  { status: 'Packed at Farm Hub', desc: 'Farmers are sorting and packing your fresh picks.' },
  { status: 'Out for Delivery', desc: 'Your driver is on the way with your order.' },
  { status: 'Delivered', desc: 'Farm-fresh goodness is at your doorstep.' },
];

@Injectable({ providedIn: 'root' })
export class OrderHistoryService {
  private readonly savedOrders = signal<TrackedOrder[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly orders = computed(() => this.savedOrders());
  readonly count = computed(() => this.orders().length);
  readonly deliveredCount = computed(() => this.orders().filter((order) => order.status === 'Delivered').length);

  constructor(private api: ApiService, private auth: AuthService) {
  }

  loadFromServer(onLoaded?: () => void) {
    if (!this.auth.isAuthenticated) {
      this.savedOrders.set([]);
      onLoaded?.();
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    this.api.orders().pipe(
      tap((orders) => this.savedOrders.set(Array.isArray(orders) ? orders.map((order) => this.normalizeImages(order)) : [])),
      catchError(() => {
        this.loadError.set('Could not load your purchases. Please try again.');
        return of(null);
      }),
    ).subscribe(() => {
      this.loading.set(false);
      onLoaded?.();
    });
  }

  addSavedOrder(order: TrackedOrder) {
    const savedOrder = this.normalizeImages(order);
    this.savedOrders.update((orders) => [savedOrder, ...orders.filter((saved) => saved.id !== savedOrder.id)]);
  }

  private normalizeImages(order: TrackedOrder): TrackedOrder {
    return {
      ...order,
      items: order.items.map((item) => ({ ...item, image: this.api.productImageUrl(item.image ?? null) })),
    };
  }

  all(): TrackedOrder[] {
    return this.orders();
  }

  latest(): TrackedOrder | undefined {
    return this.all()[0];
  }

  find(id: string): TrackedOrder | undefined {
    return this.all().find((order) => order.id === id);
  }

  requestRefund(id: string) {
    return this.api.requestOrderRefund(id).pipe(tap(() => {
      this.savedOrders.update((orders) => orders.map((order) => order.id === id ? { ...order, refundRequested: true } : order));
    }));
  }

  clearForSignOut() {
    this.savedOrders.set([]);
    this.loadError.set(null);
    this.loading.set(false);
  }

  timeline(order: TrackedOrder) {
    const stages = this.stagesFor();
    const currentStatus = this.statusFor(order);
    if (currentStatus === 'Cancelled') return stages.map((stage) => ({ title: stage.status, desc: stage.desc, state: 'pending' as const, meta: 'Order cancelled' }));
    const currentIndex = stages.findIndex((stage) => stage.status === currentStatus);
    return stages.map((stage, index) => ({
      title: stage.status,
      desc: stage.desc,
      state: currentStatus === 'Delivered' || index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending',
      meta: currentStatus === 'Delivered'
        ? 'Complete'
        : index < currentIndex
          ? 'Complete'
        : index === currentIndex
          ? 'In progress'
          : index === currentIndex + 1 ? 'Next' : 'Pending',
    }));
  }

  statusFor(order: TrackedOrder): OrderStatus {
    return order.status ?? 'Confirmed';
  }

  private stagesFor() {
    return ORDER_STAGE_DESCRIPTIONS;
  }

}
