import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { Product } from '../models/product';
import { ProductDetailModal } from '../components/product-detail-modal/product-detail-modal.component';
import { ApiProduct, ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class ProductService {
  products: Product[] = [];
  categories: string[] = [];
  loading = false;
  error: string | null = null;

  constructor(private modalCtrl: ModalController, private api: ApiService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.products().subscribe({
      next: (rows) => {
        this.products = rows.map((row) => this.toProduct(row));
        this.categories = [...new Set(this.products.map((product) => product.category).filter((category) => category !== 'Other'))];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 0
          ? 'Cannot reach the backend. Check that it is running on port 3000.'
          : error.error?.error ?? 'Could not load products from the backend.';
        this.loading = false;
      },
    });
  }

  private toProduct(row: ApiProduct): Product {
    return {
      id: Number(row.product_id),
      name: row.product_name,
      category: row.category?.category_name ?? 'Other',
      price: Number(row.price),
      unit: row.unit,
      description: row.description ?? '',
      rating: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      vitaminC: 0,
    };
  }

  get featured(): Product[] {
    return this.products.slice(0, 4);
  }

  async openDetail(product: Product) {
    const modal = await this.modalCtrl.create({
      component: ProductDetailModal,
      componentProps: { product },
      initialBreakpoint: 0.92,
      breakpoints: [0, 0.92],
      handle: true,
    });
    await modal.present();
  }
}
