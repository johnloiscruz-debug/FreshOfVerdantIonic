import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, PageHeaderComponent],
})
export class OrdersPage {
  tab: 'active' | 'past' = 'active';

  orders = [
    { id: 'FOV-8942', date: 'October 3, 2026 · 10:24 AM', status: 'In Transit', items: '3 fresh items', total: 520 },
    { id: 'FOV-8817', date: 'September 26, 2026 · 4:08 PM', status: 'Delivered', items: '5 pantry items', total: 845 },
    { id: 'FOV-8704', date: 'September 12, 2026 · 8:36 AM', status: 'Delivered', items: '4 market picks', total: 690 },
  ];

  thumbs = [0, 1, 2];

  constructor() {
    addIcons({ imageOutline });
  }

  // Active = anything not delivered yet
  get shown() {
    return this.orders.filter((o) => (this.tab === 'active') === (o.status !== 'Delivered'));
  }

  reorder(id: string) {
    // TODO: add this order's items back to the cart
    console.log('Reorder', id);
  }
}