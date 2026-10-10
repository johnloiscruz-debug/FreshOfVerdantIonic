import { Component, Input } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, cartOutline, close, heart, heartOutline, imageOutline, leafOutline, removeOutline, star } from 'ionicons/icons';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-product-detail-modal',
  templateUrl: './product-detail-modal.component.html',
  styleUrls: ['./product-detail-modal.component.scss'],
  standalone: true,
  imports: [IonContent, IonIcon],
})
export class ProductDetailModal {
  @Input() product!: Product; // passed in through componentProps
  qty = 1;
  liked = false;

  constructor(private modalCtrl: ModalController, private cart: CartService) {
    addIcons({ addOutline, cartOutline, close, heart, heartOutline, imageOutline, leafOutline, removeOutline, star });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  change(delta: number) {
    this.qty = Math.max(1, this.qty + delta);
  }

  get total() {
    return this.product.price * this.qty;
  }

  addToCart() {
    this.cart.add(this.product, this.qty);
    this.modalCtrl.dismiss();
  }
}
