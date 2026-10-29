import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bagCheckOutline, checkmarkCircleOutline, megaphoneOutline, notificationsOutline, radioOutline } from 'ionicons/icons';
import { GreenHeaderComponent } from '../../components/green-header/green-header.component';
import { ApiService, OrderNotification } from '../../services/api';

type NotificationPrefs = { orders: boolean; delivery: boolean; offers: boolean; app: boolean };

@Component({ selector: 'app-notifications', templateUrl: './notifications.page.html', styleUrls: ['./notifications.page.scss'], standalone: true, imports: [IonContent, IonIcon, FormsModule, RouterLink, GreenHeaderComponent] })
export class NotificationsPage {
  prefs: NotificationPrefs = this.load();
  orderNotifications: OrderNotification[] = [];
  notificationsLoading = false;
  notificationError = '';
  savingNotificationId: number | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private hasLoadedNotifications = false;
  private knownNotificationIds = new Set<number>();
  constructor(private api: ApiService, private router: Router, private toastCtrl: ToastController) { addIcons({ bagCheckOutline, checkmarkCircleOutline, megaphoneOutline, notificationsOutline, radioOutline }); }
  ionViewWillEnter() {
    this.loadOrderNotifications();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.loadOrderNotifications(), 30_000);
  }
  ionViewWillLeave() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = null;
  }
  private load(): NotificationPrefs {
    try { const saved = localStorage.getItem('fv-notification-prefs'); if (saved) return { orders: true, delivery: true, offers: false, app: true, ...JSON.parse(saved) as Partial<NotificationPrefs> }; } catch { /* retain defaults */ }
    return { orders: true, delivery: true, offers: false, app: true };
  }
  save() { localStorage.setItem('fv-notification-prefs', JSON.stringify(this.prefs)); }

  loadOrderNotifications() {
    this.notificationsLoading = true;
    this.notificationError = '';
    this.api.orderNotifications().subscribe({
      next: (notifications) => {
        const newClaim = this.hasLoadedNotifications
          ? notifications.find((notification) => notification.kind === 'order-claimed' && !this.knownNotificationIds.has(notification.id))
          : undefined;
        this.knownNotificationIds = new Set(notifications.map((notification) => notification.id));
        this.hasLoadedNotifications = true;
        this.orderNotifications = notifications;
        this.notificationsLoading = false;
        if (newClaim && this.prefs.orders && this.prefs.delivery) void this.showClaimToast(newClaim.title);
      },
      error: () => { this.notificationError = 'Could not load order notifications.'; this.notificationsLoading = false; },
    });
  }

  openOrder(notification: OrderNotification) {
    void this.router.navigate(['/order-tracker'], { queryParams: { order: notification.orderId } });
  }

  markAsRead(notification: OrderNotification) {
    if (notification.isRead || this.savingNotificationId === notification.id) return;
    this.savingNotificationId = notification.id;
    this.api.markOrderNotificationRead(notification.id).subscribe({
      next: () => { notification.isRead = true; this.savingNotificationId = null; },
      error: () => { this.notificationError = 'Could not update this notification.'; this.savingNotificationId = null; },
    });
  }

  formatNotificationDate(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  private async showClaimToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3500, position: 'top', color: 'success' });
    await toast.present();
  }
}
