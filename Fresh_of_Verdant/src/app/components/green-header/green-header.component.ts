import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-green-header',
  templateUrl: './green-header.component.html',
  styleUrls: ['./green-header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon, RouterLink],
})
export class GreenHeaderComponent {
  @Input() subtitle = '';
  @Input() title = '';

  constructor(public cart: CartService) {
    addIcons({ cartOutline });
  }
}
