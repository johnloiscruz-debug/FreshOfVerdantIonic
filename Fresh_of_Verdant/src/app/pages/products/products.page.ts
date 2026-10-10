import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkCircleOutline, imageOutline, leafOutline, searchOutline } from 'ionicons/icons';
import { GreenHeaderComponent } from '../../components/green-header/green-header.component';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { Product } from '../../models/product';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, GreenHeaderComponent],
})
export class ProductsPage {
  search = '';
  selectedCategory: string | null = null; // null = show everything

  constructor(public productService: ProductService, private cart: CartService) {
    addIcons({ add, checkmarkCircleOutline, imageOutline, leafOutline, searchOutline });
  }

  get filtered(): Product[] {
    const q = this.search.trim().toLowerCase();
    return this.productService.products.filter(
      (p) =>
        (!this.selectedCategory || p.category === this.selectedCategory) &&
        (!q || p.name.toLowerCase().includes(q))
    );
  }

  pickCategory(cat: string) {
    // tap again to clear the filter
    this.selectedCategory = this.selectedCategory === cat ? null : cat;
  }

  open(p: Product) {
    this.productService.openDetail(p);
  }

  quickAdd(p: Product, event: Event) {
    event.stopPropagation();
    this.cart.add(p, 1);
  }
}