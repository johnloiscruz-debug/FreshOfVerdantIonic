import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, cashOutline, checkmark, chevronDown, chatboxEllipsesOutline, locationOutline, personOutline, phonePortraitOutline, callOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CartService } from '../../services/cart';
import { ApiService } from '../../services/api';
import { OrderHistoryService } from '../../services/order-history';
import { CashlessWalletService } from '../../services/cashless-wallet';

interface SavedAddress {
  id: number;
  label: string;
  name: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  zip: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, FormsModule, PageHeaderComponent],
})
export class CheckoutPage {
  savedAddresses: SavedAddress[] = this.loadSavedAddresses();
  selectedAddressId: number | null = this.savedAddresses.find((entry) => entry.isDefault)?.id ?? this.savedAddresses[0]?.id ?? null;
  address = { street: '', barangay: '', city: 'Marikina City', zip: '' };

  private readonly zipCodes: Record<string, string> = {
    'Marikina City': '1800', 'Quezon City': '1100', Manila: '1000', 'Makati City': '1200',
    'Pasig City': '1600', 'Taguig City': '1630', 'Pasay City': '1300', 'Mandaluyong City': '1550',
    'San Juan City': '1500', 'Caloocan City': '1400', 'Las Piñas City': '1740',
    'Parañaque City': '1700', 'Valenzuela City': '1440', 'Muntinlupa City': '1770',
    'Malabon City': '1470', 'Navotas City': '1485', 'Antipolo City': '1870',
  };
  private readonly marikinaZipByBarangay: Record<string, string> = {
    'San Roque': '1801', 'Kalumpang': '1801', 'Industrial Valley': '1802',
    'Barangka': '1803', 'Tañong': '1803', 'Jesus de la Peña': '1804', 'Malanday': '1805',
    'Concepcion Uno': '1807', 'Tumana': '1807', 'Nangka': '1808', 'Parang': '1809',
    'Fortune': '1809', 'Marikina Heights': '1810', 'Concepcion Dos': '1811', 'Sto. Niño': '1800',
  };

  readonly cities = [
    'Marikina City', 'Quezon City', 'Manila', 'Makati City', 'Pasig City', 'Taguig City',
    'Pasay City', 'Mandaluyong City', 'San Juan City', 'Caloocan City', 'Las Piñas City',
    'Parañaque City', 'Valenzuela City', 'Muntinlupa City', 'Malabon City', 'Navotas City',
    'Antipolo City',
  ];
  private readonly barangaysByCity: Record<string, string[]> = {
    'Marikina City': ['San Roque', 'Concepcion Uno', 'Sto. Niño', 'Malanday', 'Barangka', 'Calumpang', 'Industrial Valley', 'Jesus de la Peña', 'Marikina Heights', 'Nangka', 'Parang', 'Santa Elena', 'Tumana', 'Fortune'],
    'Quezon City': ['Batasan Hills', 'Commonwealth', 'Diliman', 'Holy Spirit', 'Project 6', 'Tandang Sora', 'Bagong Pag-asa', 'Loyola Heights', 'Pinyahan'],
    'Manila': ['Binondo', 'Ermita', 'Malate', 'Paco', 'Pandacan', 'Sampaloc', 'San Miguel', 'Santa Cruz', 'Tondo'],
    'Makati City': ['Bel-Air', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Palanan', 'Poblacion', 'San Lorenzo', 'Urdaneta'],
    'Pasig City': ['Bagong Ilog', 'Kapitolyo', 'Maybunga', 'Manggahan', 'Rosario', 'Santolan', 'Ugong'],
    'Taguig City': ['Bagumbayan', 'Bicutan', 'Fort Bonifacio', 'Pinagsama', 'Ususan', 'Western Bicutan'],
    'Pasay City': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 76', 'Barangay 183'],
    'Mandaluyong City': ['Addition Hills', 'Barangka', 'Highway Hills', 'Plainview', 'Wack-Wack Greenhills'],
    'San Juan City': ['Batis', 'Greenhills', 'Little Baguio', 'Pedro Cruz', 'Salapan', 'West Crame'],
    'Caloocan City': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 8', 'Barangay 176'],
    'Las Piñas City': ['Almanza Uno', 'BF International Village', 'Pamplona Uno', 'Talon Uno', 'Zapote'],
    'Parañaque City': ['Baclaran', 'Don Bosco', 'La Huerta', 'San Antonio', 'San Dionisio', 'Tambo'],
    'Valenzuela City': ['Canumay East', 'Gen. T. de Leon', 'Karuhatan', 'Marulas', 'Maysan', 'Malanday'],
    'Muntinlupa City': ['Alabang', 'Bayanan', 'Putatan', 'Sucat', 'Tunasan'],
    'Malabon City': ['Catmon', 'Concepcion', 'Longos', 'Potrero', 'Tonsuya'],
    'Navotas City': ['Bangkulasi', 'North Bay Boulevard North', 'North Bay Boulevard South', 'San Jose', 'Tanza'],
    'Antipolo City': ['Cupang', 'Dalig', 'Mayamot', 'San Isidro', 'San Jose', 'San Roque'],
  };

  get barangays(): string[] {
    return this.barangaysByCity[this.address.city] ?? [];
  }

  onCityChange(city: string) {
    this.address.city = city;
    this.address.barangay = this.barangays[0] ?? '';
    this.updateZipCode();
    this.selectedAddressId = null;
  }

  onBarangayChange(barangay: string) {
    this.address.barangay = barangay;
    this.updateZipCode();
    this.selectedAddressId = null;
  }

  private updateZipCode() {
    this.address.zip = this.address.city === 'Marikina City'
      ? this.marikinaZipByBarangay[this.address.barangay] ?? this.zipCodes[this.address.city] ?? ''
      : this.zipCodes[this.address.city] ?? '';
  }

  selectSavedAddress(id: number | null) {
    this.selectedAddressId = id;
    this.address = this.addressFromSaved(this.savedAddresses.find((entry) => entry.id === id));
  }

  private loadSavedAddresses(): SavedAddress[] {
    try {
      const stored = localStorage.getItem('fv-addresses');
      return stored ? JSON.parse(stored) as SavedAddress[] : [];
    } catch {
      return [];
    }
  }

  private addressFromSaved(saved?: SavedAddress) {
    const city = saved?.city && this.cities.includes(saved.city) ? saved.city : this.cities[0];
    const barangay = saved?.barangay ?? '';
    return {
      street: saved?.street ?? '',
      barangay,
      city,
      zip: city === 'Marikina City'
        ? this.marikinaZipByBarangay[barangay] ?? this.zipCodes[city] ?? ''
        : this.zipCodes[city] ?? '',
    };
  }

  readonly deliveryFee = 89;
  scheduleDate = '';
  scheduleTime = '';

  payments = [
    { id: 'cod', title: 'Pay on Cash', desc: 'Pay your driver upon arrival', icon: 'cash-outline' },
    { id: 'cashless', title: 'Cashless', desc: 'Pay digitally on delivery', icon: 'phone-portrait-outline' },
  ];
  payment = localStorage.getItem('fv-payment-method') === 'cashless' ? 'cashless' : 'cod';
  cashTendered = '';

  notes = '';
  placingOrder = false;

  constructor(public cart: CartService, private router: Router, private orderHistory: OrderHistoryService, private alerts: AlertController, public wallet: CashlessWalletService, private api: ApiService) {
    addIcons({ callOutline, cardOutline, cashOutline, checkmark, chevronDown, chatboxEllipsesOutline, locationOutline, personOutline, phonePortraitOutline, shieldCheckmarkOutline });
    this.selectSavedAddress(this.selectedAddressId);
    const initialSchedule = new Date();
    initialSchedule.setMinutes(Math.ceil((initialSchedule.getMinutes() + 30) / 5) * 5, 0, 0);
    this.scheduleDate = this.toDateInputValue(initialSchedule);
    this.scheduleTime = `${String(initialSchedule.getHours()).padStart(2, '0')}:${String(initialSchedule.getMinutes()).padStart(2, '0')}`;
  }

  get fee() {
    return this.deliveryFee;
  }

  get minScheduleDate() {
    return this.toDateInputValue(new Date());
  }

  get scheduleError(): string | null {
    if (!this.scheduleDate || !this.scheduleTime) return 'Choose a delivery date and time.';
    if (this.scheduleDate !== this.minScheduleDate) return 'Same-day delivery is only available for today.';
    const scheduled = new Date(`${this.scheduleDate}T${this.scheduleTime}`);
    if (!Number.isFinite(scheduled.getTime())) return 'Choose a valid delivery date and time.';
    if (scheduled.getTime() <= Date.now()) return 'Choose a future delivery time.';
    return null;
  }

  get deliveryWindow() {
    if (!this.scheduleDate || !this.scheduleTime) return 'Choose a date and time';
    const scheduled = new Date(`${this.scheduleDate}T${this.scheduleTime}`);
    return Number.isFinite(scheduled.getTime())
      ? scheduled.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'Choose a date and time';
  }

  private toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openSchedulePicker(input: HTMLInputElement, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    try {
      if (picker.showPicker) picker.showPicker();
      else input.focus();
    } catch {
      input.focus();
    }
  }

  get total() {
    return this.cart.subtotal() + this.fee + this.cart.tax();
  }

  get totalChange(): number | null {
    if (!this.cashTendered) return null;
    const tendered = Number(this.cashTendered);
    return Number.isFinite(tendered) && tendered >= this.total ? tendered - this.total : null;
  }

  get cashTenderError(): string | null {
    if (!this.cashTendered) return null;
    const tendered = Number(this.cashTendered);
    if (!Number.isFinite(tendered) || tendered <= 0) return 'Enter a cash amount greater than zero.';
    if (tendered < this.total) return `Cash tendered must cover the total due of ₱${this.total.toFixed(2)}.`;
    return null;
  }

  get cashlessShortfall(): number {
    return Math.max(0, this.total - this.wallet.balance());
  }

  get paymentValid(): boolean {
    return this.payment === 'cashless' ? this.wallet.canPay(this.total) : !this.cashTenderError;
  }

  choosePayment(method: string) {
    this.payment = method;
    localStorage.setItem('fv-payment-method', method === 'cashless' ? 'cashless' : 'cash');
    if (method === 'cashless') {
      void this.router.navigate(['/cashless-wallet'], { queryParams: { returnTo: '/checkout', amount: this.total } });
    }
  }

  placeOrder() {
    if (this.placingOrder || this.cart.items().length === 0) return;

    if (this.scheduleError) {
      void this.showScheduleError();
      return;
    }

    if (!this.paymentValid) {
      if (this.payment === 'cashless') void this.showWalletInsufficient();
      return;
    }

    const orderDetails = {
      items: this.cart.items().map((item) => ({ id: item.id, qty: item.qty })),
      address: `${this.address.street}, ${this.address.barangay}, ${this.address.city} ${this.address.zip}`,
      street: this.address.street.trim(),
      barangay: this.address.barangay,
      city: this.address.city,
      zipCode: this.address.zip,
      payment: this.payment === 'cod' ? 'Cash on Delivery' : 'Cashless Wallet',
      deliveryDate: this.scheduleDate,
      deliveryTime: this.scheduleTime,
      cashTendered: this.payment === 'cod' && this.cashTendered ? Number(this.cashTendered) : null,
      totalChange: this.payment === 'cashless' ? 0 : this.totalChange,
      orderNotes: this.notes.trim(),
      deliveryWindow: this.deliveryWindow,
      deliverySchedule: 'same-day' as const,
      deliveryFee: this.fee,
    };

    this.placingOrder = true;
    const charged = this.payment === 'cashless' && this.wallet.charge(this.total, 'Order payment');
    if (this.payment === 'cashless' && !charged) {
      this.placingOrder = false;
      void this.showWalletInsufficient();
      return;
    }
    this.api.createOrder(orderDetails).subscribe({
      next: (order) => {
        this.cart.clearLocalAfterCheckout();
        this.orderHistory.addSavedOrder(order);
        void this.router.navigate(['/order-tracker'], { queryParams: { order: order.id } });
      },
      error: (error: unknown) => {
        this.placingOrder = false;
        if (charged) this.wallet.restoreCharge(this.total);
        void this.showCheckoutError(error);
      },
    });
  }

  private async showWalletInsufficient() {
    const alert = await this.alerts.create({
      header: 'Wallet balance is too low',
      message: `Add demo funds to cover the ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(this.total)} order total.`,
      buttons: [
        { text: 'Not now', role: 'cancel' },
        { text: 'Open Cashless Wallet', handler: () => { void this.router.navigate(['/cashless-wallet'], { queryParams: { returnTo: '/checkout', amount: this.total } }); } },
      ],
    });
    await alert.present();
  }

  openWallet() {
    void this.router.navigate(['/cashless-wallet'], { queryParams: { returnTo: '/checkout', amount: this.total } });
  }

  private async showScheduleError() {
    const alert = await this.alerts.create({
      header: 'Choose a delivery time',
      message: this.scheduleError ?? 'Choose a future delivery date and time.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async showCheckoutError(error: unknown) {
    let message = 'Your order could not be saved. Please try again.';
    if (error instanceof HttpErrorResponse) {
      const serverMessage = typeof error.error?.error === 'string' ? error.error.error : '';
      const serverDetails = typeof error.error?.details === 'string' ? error.error.details : '';
      if (error.status === 0) message = 'The backend at http://localhost:3000 is not reachable. Start IPTBACKEND and try again.';
      else if (error.status === 401 || error.status === 403) message = 'Your sign-in session has expired. Sign in again before placing your order.';
      else if (error.status === 404) message = 'The order service is unavailable. Restart IPTBACKEND and try again.';
      else if (error.status >= 500) message = serverDetails ? `${serverMessage || 'The backend could not save your order.'}: ${serverDetails}` : serverMessage || 'The backend could not save your order. Check the IPTBACKEND log for the database error.';
      else message = serverMessage || `The order could not be saved (HTTP ${error.status}).`;
    }
    const alert = await this.alerts.create({
      header: 'Unable to complete checkout',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
