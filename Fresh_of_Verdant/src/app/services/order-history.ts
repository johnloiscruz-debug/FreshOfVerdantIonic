import { computed, Injectable, signal } from '@angular/core';
import { CartItem } from '../models/product';
import { ApiService } from './api';
import { AuthService } from './auth';
import { catchError, of, tap } from 'rxjs';

export interface TrackedOrder {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  address: string;
  payment: string;
  deliveryWindow: string;
  deliverySchedule?: 'standard' | 'same-day';
  refundRequested?: boolean;
}

export type OrderStatus = 'Confirmed' | 'Packed at Farm Hub' | 'Out for Delivery' | 'Delivered';

const ORDER_STAGE_DESCRIPTIONS: Array<{ status: OrderStatus; desc: string }> = [
  { status: 'Confirmed', desc: 'We received your order and reserved the produce.' },
  { status: 'Packed at Farm Hub', desc: 'Farmers are sorting and packing your fresh picks.' },
  { status: 'Out for Delivery', desc: 'Your driver is on the way with your order.' },
  { status: 'Delivered', desc: 'Farm-fresh goodness is at your doorstep.' },
];

@Injectable({ providedIn: 'root' })
export class OrderHistoryService {
  private readonly savedOrders = signal<TrackedOrder[]>([]);
  private readonly clock = signal(Date.now());
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly orders = computed(() => {
    const now = this.clock();
    return this.savedOrders().map((order) => ({ ...order, status: this.statusAt(order, now) }));
  });
  readonly count = computed(() => this.orders().length);
  readonly deliveredCount = computed(() => this.orders().filter((order) => order.status === 'Delivered').length);

  constructor(private api: ApiService, private auth: AuthService) {
    setInterval(() => this.clock.set(Date.now()), 5000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.clock.set(Date.now());
      });
    }
  }

  loadFromServer() {
    if (!this.auth.isAuthenticated) {
      this.savedOrders.set([]);
      return;
    }
    this.savedOrders.set([]);
    this.loading.set(true);
    this.loadError.set(null);
    this.api.orders().pipe(
      tap((orders) => this.savedOrders.set(Array.isArray(orders) ? orders.map((order) => this.normalizeImages(order)) : [])),
      catchError(() => {
        this.loadError.set('Could not load your purchases. Please try again.');
        return of(null);
      }),
    ).subscribe(() => this.loading.set(false));
  }

  addSavedOrder(order: TrackedOrder) {
    const savedOrder = this.normalizeImages(order);
    this.savedOrders.update((orders) => [savedOrder, ...orders.filter((saved) => saved.id !== savedOrder.id)]);
    this.clock.set(Date.now());
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
    const stages = this.stagesFor(order);
    const currentStatus = this.statusAt(order, this.clock());
    const currentIndex = stages.findIndex((stage) => stage.status === currentStatus);
    const createdAt = new Date(order.createdAt).getTime();

    return stages.map((stage, index) => ({
      title: stage.status,
      desc: stage.desc,
      state: currentStatus === 'Delivered' || index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending',
      meta: currentStatus === 'Delivered'
        ? this.formatTime(new Date(createdAt + stage.timelineAfterMs))
        : index < currentIndex
          ? this.formatTime(new Date(createdAt + stage.afterMs))
        : index === currentIndex
          ? 'In progress'
          : index === currentIndex + 1 ? 'Next' : 'Pending',
    }));
  }

  timelineTimes(order: TrackedOrder): string[] {
    const offsets = order.deliverySchedule === 'same-day' ? [0, 2, 4, 6] : [0, 2, 6, 8];
    const createdAt = new Date(order.createdAt).getTime();
    return offsets.map((minutes) => this.formatTime(new Date(createdAt + minutes * 60_000)));
  }

  statusFor(order: TrackedOrder): OrderStatus {
    return this.statusAt(order, this.clock());
  }

  private statusAt(order: TrackedOrder, now: number): OrderStatus {
    const createdAt = new Date(order.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return order.status ?? 'Confirmed';
    const elapsed = Math.max(0, now - createdAt);
    return [...this.stagesFor(order)].reverse().find((stage) => elapsed >= stage.afterMs)?.status ?? 'Confirmed';
  }

  private stagesFor(order: TrackedOrder) {
    const sameDay = order.deliverySchedule === 'same-day';
    const milestoneMinutes = sameDay ? [0, 2, 4, 6] : [0, 2, 6, 8];
    const progressionMinutes = sameDay ? [0, 2, 4, 6] : [0, 2, 6, 8];
    return ORDER_STAGE_DESCRIPTIONS.map((stage, index) => ({
      ...stage,
      // The timeline advances through each dot on a compressed delivery simulation.
      afterMs: progressionMinutes[index] * 60_000,
      timelineAfterMs: milestoneMinutes[index] * 60_000,
    }));
  }

  private formatTime(value: Date) {
    return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

}
