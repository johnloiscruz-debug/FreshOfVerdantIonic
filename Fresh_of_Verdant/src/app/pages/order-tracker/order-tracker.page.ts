import { Component } from '@angular/core';
import { IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, chatbubbleOutline, checkmark, imageOutline, personOutline, swapVerticalOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-order-tracker',
  templateUrl: './order-tracker.page.html',
  styleUrls: ['./order-tracker.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, PageHeaderComponent],
})
export class OrderTrackerPage {
  orderId = 'FOV-8942';

  // state: done | active | next | pending
  steps = [
    { title: 'Order Confirmed', desc: 'We received your order and reserved the produce.', meta: '9:42 AM', state: 'done' },
    { title: 'Packed at Farm Hub', desc: 'Farmers are sorting and packing your fresh picks.', meta: 'In progress', state: 'active' },
    { title: 'Out for Delivery', desc: 'Your driver will share a live arrival update.', meta: 'Next', state: 'next' },
    { title: 'Delivered', desc: 'Farm-fresh goodness at your doorstep.', meta: 'Pending', state: 'pending' },
  ];

  constructor(public cart: CartService) {
    addIcons({ callOutline, chatbubbleOutline, checkmark, imageOutline, personOutline, swapVerticalOutline });
  }
}