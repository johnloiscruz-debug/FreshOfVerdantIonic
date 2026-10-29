import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonMenuButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkCircleOutline, imageOutline, nutritionOutline, remove, trashOutline } from 'ionicons/icons';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonMenuButton, RouterLink],
})
export class CartPage {
  constructor(public cart: CartService, private router: Router) {
    addIcons({ add, checkmarkCircleOutline, imageOutline, nutritionOutline, remove, trashOutline });
  }

  checkout() {
    void this.router.navigateByUrl('/splash', { state: { splashMode: 'checkout' } });
  }

  ionViewWillEnter() {
    this.cart.load();
  }
}
