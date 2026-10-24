import { Component } from '@angular/core';
import { ActionSheetController, AlertController, IonContent, IonFooter, IonIcon, ModalController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { callOutline, chatbubbleOutline, checkmark, imageOutline, personOutline, swapHorizontalOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { OrderReceiptModalComponent } from '../../components/order-receipt-modal/order-receipt-modal.component';
import { CartService } from '../../services/cart';
import { OrderHistoryService, TrackedOrder } from '../../services/order-history';

@Component({
  selector: 'app-order-tracker',
  templateUrl: './order-tracker.page.html',
  styleUrls: ['./order-tracker.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, PageHeaderComponent],
})
export class OrderTrackerPage {
  order?: TrackedOrder;
  orderId = 'FOV-8942';
  orderItems = [] as ReturnType<CartService['items']>;
  orderTotal = 0;
  shippingAddress = '28 Sampaguita St., San Roque, Marikina';
  paymentMethod = 'Cash on Delivery';
  deliveryWindow = 'Tomorrow, 8 AM-12 PM';
  get pendingOrders() { return this.history.all().filter((order) => !['Delivered', 'Cancelled'].includes(this.history.statusFor(order))); }

  get steps() {
    return this.order
      ? this.history.timeline(this.order)
      : [
          { title: 'Order Confirmed', desc: 'We received your order and reserved the produce.', meta: 'In progress', state: 'active' },
          { title: 'Packed at Farm Hub', desc: 'Farmers are sorting and packing your fresh picks.', meta: 'Next', state: 'pending' },
          { title: 'Out for Delivery', desc: 'Your driver is on the way with your order.', meta: 'Pending', state: 'pending' },
          { title: 'Delivered', desc: 'Farm-fresh goodness is at your doorstep.', meta: 'Pending', state: 'pending' },
        ];
  }

  get currentStatus() { return this.order ? this.history.statusFor(this.order) : 'Confirmed'; }
  get liveClock() { return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }

  goToMainMenu() {
    void this.router.navigateByUrl('/home');
  }

  constructor(
    public cart: CartService,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router,
    route: ActivatedRoute,
    public history: OrderHistoryService,
  ) {
    addIcons({ callOutline, chatbubbleOutline, checkmark, imageOutline, personOutline, swapHorizontalOutline });
    this.orderItems = this.cart.items();
    this.orderTotal = this.cart.total();
    route.queryParamMap.subscribe((params) => this.selectOrder(params.get('order')));
  }

  trackOrder(id: string) {
    this.selectOrder(id);
    void this.router.navigate(['/order-tracker'], { queryParams: { order: id } });
  }

  private selectOrder(id: string | null) {
    this.order = id ? this.history.find(id) : undefined;
    if (!this.order) {
      this.orderId = 'FOV-8942';
      this.orderItems = this.cart.items();
      this.orderTotal = this.cart.total();
      this.shippingAddress = '28 Sampaguita St., San Roque, Marikina';
      this.paymentMethod = 'Cash on Delivery';
      this.deliveryWindow = 'Tomorrow, 8 AM-12 PM';
      return;
    }
    this.orderId = this.order.id;
    this.orderItems = this.order.items;
    this.orderTotal = this.order.total;
    this.shippingAddress = this.order.address;
    this.paymentMethod = this.order.payment;
    this.deliveryWindow = this.order.deliveryWindow;
  }

  trackingSteps(order: TrackedOrder) {
    const times = this.history.timelineTimes(order);
    return this.history.timeline(order).map((step, index) => ({ ...step, time: times[index] }));
  }

  formatOrderDate(value: string) { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }

  async openOrderActions() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Order options',
      buttons: [
        { text: 'Copy order ID', handler: () => { void this.copyOrderId(); } },
        { text: 'Main menu', handler: () => { void this.router.navigateByUrl('/home'); } },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async openReceipt() {
    const receiptOrder: TrackedOrder = this.order ?? {
      id: this.orderId,
      createdAt: new Date().toISOString(),
      status: 'Confirmed',
      items: this.orderItems,
      total: this.orderTotal,
      address: this.shippingAddress,
      payment: this.paymentMethod,
      deliveryWindow: this.deliveryWindow,
    };
    const modal = await this.modalCtrl.create({
      component: OrderReceiptModalComponent,
      componentProps: { order: receiptOrder, allowRefund: !!this.order },
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'request-refund') await this.confirmRefund();
  }

  private async confirmRefund() {
    if (!this.order) return;
    const alert = await this.alertCtrl.create({
      header: 'Request a refund?',
      message: 'This demo records a refund request for the order. It does not contact a payment provider.',
      buttons: [
        { text: 'Keep order', role: 'cancel' },
        { text: 'Submit request', handler: () => {
          if (!this.order) return;
          this.history.requestRefund(this.order.id).subscribe({
            next: () => {
              if (this.order) this.order = this.history.find(this.order.id);
              void this.showToast('Refund request saved');
            },
            error: () => void this.showToast('Could not save the refund request'),
          });
        } },
      ],
    });
    await alert.present();
  }

  private async copyOrderId() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(this.orderId);
      await this.showToast('Order ID copied');
    } catch {
      await this.showToast(`Order ID: ${this.orderId}`);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2200, position: 'bottom' });
    await toast.present();
  }
}
