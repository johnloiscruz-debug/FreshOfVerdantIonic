import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { catchError, finalize, map, of } from 'rxjs';
import { Product } from '../models/product';
import { ProductDetailModal } from '../components/product-detail-modal/product-detail-modal.component';
import { ApiProduct, ApiService } from './api';

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  products: Product[] = [];
  categories: string[] = [];
  categoryItems: ProductCategory[] = [];
  loading = false;
  error: string | null = null;

  constructor(private modalCtrl: ModalController, private api: ApiService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;

    this.api.products().pipe(
      map((rows) => {
        if (!Array.isArray(rows)) {
          throw new Error('The products endpoint returned an unexpected response. Expected a JSON array.');
        }

        const categories = new Map<number, ProductCategory>();
        for (const row of rows) {
          if (row.category) {
            categories.set(Number(row.category.category_id), {
              id: Number(row.category.category_id),
              name: row.category.category_name,
              description: row.category.description ?? '',
            });
          }
        }

        return {
          products: rows.map((row) => this.toProduct(row)),
          categoryItems: [...categories.values()],
        };
      }),
      catchError((error: unknown) => {
        this.products = [];
        this.categories = [];
        this.categoryItems = [];
        this.error = this.getLoadError(error);
        return of({ products: [] as Product[], categoryItems: [] as ProductCategory[] });
      }),
      finalize(() => {
        this.loading = false;
      }),
    ).subscribe(({ products, categoryItems }) => {
      this.products = products;
      this.categoryItems = categoryItems;
      this.categories = categoryItems.map((category) => category.name).filter((category) => category !== 'Other');
    });
  }

  private getLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach the backend at localhost:3000. Check that the server is running.';
      }
      if (error.status >= 500) {
        return 'The backend failed while loading products. Check its server log and Turso database connection.';
      }
      const detail = error.error?.error;
      return typeof detail === 'string' ? detail : `Product request failed (HTTP ${error.status}).`;
    }

    return error instanceof Error ? error.message : 'Could not load products from the backend.';
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
      image: row.image_url ?? undefined,
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
