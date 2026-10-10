import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, carOutline, imageOutline, nutritionOutline, remove, trashOutline } from 'ionicons/icons';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink],
})
export class CartPage {
  constructor(public cart: CartService) {
    addIcons({ add, carOutline, imageOutline, nutritionOutline, remove, trashOutline });
  }
}