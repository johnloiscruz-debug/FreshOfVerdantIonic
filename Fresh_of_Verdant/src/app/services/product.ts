import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Product } from '../models/product';
import { ProductDetailModal } from '../components/product-detail-modal/product-detail-modal.component';

const DESC =
  'Sweet, juicy produce grown without synthetic pesticides. Hand-picked at peak ripeness for salads, sauces, and everyday cooking.';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Sample data. Later you can replace this with an API call.
  products: Product[] = [
    { id: 1, name: 'Garden Tomatoes', category: 'Fresh Vegetables', price: 85, unit: 'kg', description: DESC, rating: 4.9, calories: 18, protein: 0.9, carbs: 3.9, vitaminC: 14, image: 'assets/images/Vegetables/tomatoes.png', featured: true },
    { id: 2, name: 'Fresh Lettuce', category: 'Fresh Vegetables', price: 55, unit: 'pc', description: DESC, rating: 4.7, calories: 15, protein: 1.4, carbs: 2.9, vitaminC: 9, image: 'assets/images/Vegetables/lettuce.png', featured: true },
    { id: 3, name: 'Lakatan Bananas', category: 'Organic Fruits', price: 95, unit: 'kg', description: DESC, rating: 4.8, calories: 89, protein: 1.1, carbs: 23, vitaminC: 9, image: 'assets/images/Fruits/banana.png', featured: true },
    { id: 4, name: 'Highland Carrots', category: 'Root Crops', price: 120, unit: 'kg', description: DESC, rating: 4.6, calories: 41, protein: 0.9, carbs: 10, vitaminC: 6, image: 'assets/images/Vegetables/carrots.png', featured: true },
    { id: 5, name: 'Carabao Mangoes', category: 'Organic Fruits', price: 180, unit: 'kg', description: DESC, rating: 4.9, calories: 60, protein: 0.8, carbs: 15, vitaminC: 36, image: 'assets/images/Fruits/mangoes.png' },
    { id: 6, name: 'Organic Pechay', category: 'Fresh Vegetables', price: 78, unit: 'kg', description: DESC, rating: 4.5, calories: 13, protein: 1.5, carbs: 2.2, vitaminC: 45, image: 'assets/images/Vegetables/pechay.png' },
    { id: 7, name: 'Purple Kamote', category: 'Root Crops', price: 105, unit: 'kg', description: DESC, rating: 4.7, calories: 86, protein: 1.6, carbs: 20, vitaminC: 2, image: 'assets/images/Vegetables/kamote.png' },
    { id: 8, name: 'Dinorado Rice', category: 'Grains & Staples', price: 92, unit: 'kg', description: DESC, rating: 4.8, calories: 130, protein: 2.7, carbs: 28, vitaminC: 0, image: 'assets/images/Grains/rice.png' },
  ];

  categories = ['Organic Fruits', 'Fresh Vegetables', 'Root Crops', 'Grains & Staples'];

  constructor(private modalCtrl: ModalController) {}

  get featured(): Product[] {
    return this.products.filter((p) => p.featured);
  }

  // Opens the product detail as a bottom sheet (like the Figma design)
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