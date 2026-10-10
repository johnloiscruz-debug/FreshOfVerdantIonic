import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, cashOutline, checkmark, chevronDown, chatboxEllipsesOutline, locationOutline, personOutline, phonePortraitOutline, callOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, FormsModule, PageHeaderComponent],
})
export class CheckoutPage {
  recipient = { name: 'Mika Santos', phone: '0817 555 0186' };
  address = { street: '28 Sampaguita Street', barangay: 'San Roque', city: 'Marikina City', zip: '1801' };

  barangays = ['San Roque', 'Concepcion Uno', 'Sto. Niño', 'Malanday'];
  cities = ['Marikina City', 'Quezon City', 'Antipolo City', 'Pasig City'];

  schedules = [
    { id: 'standard', title: 'Standard', fee: 49, time: 'Tomorrow, 8 AM-12 PM' },
    { id: 'same-day', title: 'Same-Day', fee: 89, time: 'Today, 4-7 PM' },
  ];
  schedule = 'standard';

  payments = [
    { id: 'cod', title: 'Cash on Delivery', desc: 'Pay your driver upon arrival', icon: 'cash-outline' },
    { id: 'gcash', title: 'GCash', desc: 'Fast and secure e-wallet', icon: 'phone-portrait-outline' },
    { id: 'card', title: 'Credit Card', desc: 'Visa, Mastercard, JCB', icon: 'card-outline' },
  ];
  payment = 'cod';

  notes = '';

  constructor(private cart: CartService, private router: Router) {
    addIcons({ callOutline, cardOutline, cashOutline, checkmark, chevronDown, chatboxEllipsesOutline, locationOutline, personOutline, phonePortraitOutline, shieldCheckmarkOutline });
  }

  get fee() {
    return this.schedules.find((s) => s.id === this.schedule)!.fee;
  }

  get total() {
    return this.cart.subtotal() + this.fee + this.cart.tax();
  }

  placeOrder() {
    // TODO: send the order to your API, then clear the cart
    this.router.navigateByUrl('/order-tracker');
  }
}