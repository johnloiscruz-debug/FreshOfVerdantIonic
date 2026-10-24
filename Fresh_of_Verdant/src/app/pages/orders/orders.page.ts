import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { OrderHistoryService } from '../../services/order-history';
import { ProductService } from '../../services/product';
import { CartItem } from '../../models/product';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, PageHeaderComponent],
})
export class OrdersPage {
  tab: 'active' | 'past' = 'active';

  constructor(public history: OrderHistoryService, public productService: ProductService) {
    addIcons({ imageOutline });
    this.history.loadFromServer();
  }

  get orders(): Array<{ id: string; date: string; status: string; delivered: boolean; refundRequested: boolean; items: string; total: number; previews?: CartItem[] }> {
    return this.history.all().map((order) => ({
      id: order.id,
      date: new Date(order.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }),
      status: order.refundRequested ? 'Refund Requested' : order.status === 'Delivered' ? 'Delivered' : order.status === 'Cancelled' ? 'Cancelled' : 'Pending',
      delivered: order.status === 'Delivered',
      refundRequested: !!order.refundRequested,
      items: `${order.items.reduce((count, item) => count + item.qty, 0)} fresh items`,
      total: order.total,
      previews: order.items,
    }));
  }

  // Active = anything not delivered yet
  get shown() {
    return this.orders.filter((o) => (this.tab === 'active') === (!o.delivered && o.status !== 'Cancelled'));
  }

  previewsFor(order: (typeof this.orders)[number]): CartItem[] {
    const items = order.previews?.length
      ? order.previews
      : this.productService.products().slice(0, 3).map((product) => ({ id: product.id, name: product.name, price: product.price, unit: product.unit, qty: 1, image: product.image }));
    return items.slice(0, 3).map((item) => ({
      ...item,
      image: item.image ?? this.productService.products().find((product) => product.id === item.id)?.image,
    }));
  }

  reorder(id: string) {
    // TODO: add this order's items back to the cart
    console.log('Reorder', id);
  }
}
