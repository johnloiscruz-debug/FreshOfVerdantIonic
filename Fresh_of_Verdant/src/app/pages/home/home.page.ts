import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cubeOutline, imageOutline, sparklesOutline } from 'ionicons/icons';
import { GreenHeaderComponent } from '../../components/green-header/green-header.component';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, GreenHeaderComponent],
})
export class HomePage {
  constructor(public products: ProductService) {
    addIcons({ add, cubeOutline, imageOutline, sparklesOutline });
  }

  open(product: Product) {
    this.products.openDetail(product);
  }
}