import { computed, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { catchError, concatMap, finalize, from, map, of, switchMap, TimeoutError, timeout, toArray } from 'rxjs';
import { Product } from '../models/product';
import { ProductDetailModal } from '../components/product-detail-modal/product-detail-modal.component';
import { ApiProduct, ApiService } from './api';
import { ReviewService } from './reviews';
import { AuthService } from './auth';

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly missingProductImages: Record<string, { asset: string; sourceFile: string; creator: string }> = {
    teff: { asset: 'teff.jpg', sourceFile: 'Lalibela-Teff.jpg', creator: 'Ji-Elle · CC BY-SA 3.0' },
    einkorn: { asset: 'einkorn.jpg', sourceFile: 'Triticum monococcum MHNT.BOT.2015.2.37.jpg', creator: 'Roger Culos · CC BY-SA 3.0' },
    buckwheat: { asset: 'buckwheat.jpg', sourceFile: 'Fagopyrum esculentum seeds (boekweit).jpg', creator: 'Rasbak · CC BY-SA 3.0' },
    millet: { asset: 'millet.png', sourceFile: 'Milletgrains.png', creator: 'Zigzig20s · Public domain' },
    sorghum: { asset: 'sorghum.jpg', sourceFile: 'Sorghum bicolor subsp. bicolor seeds.jpg', creator: 'Tracey Slotta / USDA · Public domain' },
    rye: { asset: 'rye.jpg', sourceFile: 'Rye grains rotated.jpg', creator: 'Agronom · CC BY-SA 3.0' },
    oat: { asset: 'oats.jpg', sourceFile: 'Uncooked oat groats.jpg', creator: 'Acsenray · CC0' },
    barley: { asset: 'barley.jpg', sourceFile: 'Barley grains.jpg', creator: 'National Institute of Korean Language · CC BY-SA 2.0 KR' },
    corn: { asset: 'corn.jpg', sourceFile: 'Corn kernels.jpg', creator: 'Danielgrad · CC BY-SA 3.0' },
    wheat: { asset: 'wheat.jpg', sourceFile: 'Triticum aestivum naked wheat kernels.jpg', creator: 'Peer Schilperoord · CC BY-SA 4.0' },
    rice: { asset: 'rice.jpg', sourceFile: 'Rice grains.jpg', creator: 'Vadakkan · CC BY-SA 3.0' },
    olive: { asset: 'olives.jpg', sourceFile: 'Black Olives.JPG', creator: 'Miansari66 · Public domain' },
    blueberry: { asset: 'blueberries.jpg', sourceFile: 'Wet blueberries close up.jpg', creator: 'Comfreak · CC0' },
  };

  readonly products = signal<Product[]>([]);
  readonly categories = signal<string[]>([]);
  readonly categoryItems = signal<ProductCategory[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly favorites = signal<number[]>(JSON.parse(localStorage.getItem('fv-favorites') ?? '[]'));

  toggleFavorite(product: Product) {
    const wasFavorite = this.favorites().includes(product.id);
    const next = wasFavorite
      ? this.favorites().filter((id) => id !== product.id)
      : [...this.favorites(), product.id];
    this.favorites.set(next);
    localStorage.setItem('fv-favorites', JSON.stringify(next));

    if (this.auth.isAuthenticated) {
      const request = wasFavorite
        ? this.api.removeWishlistItem(product.id)
        : this.api.saveWishlistItem(product.id);
      request.pipe(catchError((error) => {
        const current = this.favorites();
        const restored = wasFavorite
          ? [...current, product.id]
          : current.filter((id) => id !== product.id);
        this.setFavorites(restored);
        console.error('Could not save wishlist change to the account.', error);
        return of(undefined);
      })).subscribe();
    }
  }

  isFavorite(product: Product) { return this.favorites().includes(product.id); }

  clearFavoritesForSignOut() {
    this.favorites.set([]);
    localStorage.removeItem('fv-favorites');
  }

  connectWishlistToAccount() {
    if (!this.auth.isAuthenticated) return;

    const localIds = [...new Set(this.favorites().filter((id) => Number.isSafeInteger(id) && id > 0))];
    from(localIds).pipe(
      concatMap((id) => this.api.saveWishlistItem(id).pipe(catchError(() => of(undefined)))),
      toArray(),
      switchMap(() => this.api.wishlist()),
    ).subscribe({
      next: (items) => this.setFavorites(items.map((item) => Number(item.product_id)).filter((id) => Number.isSafeInteger(id) && id > 0)),
      error: (error) => console.error('Could not load the account wishlist.', error),
    });
  }

  private setFavorites(ids: number[]) {
    const uniqueIds = [...new Set(ids)];
    this.favorites.set(uniqueIds);
    localStorage.setItem('fv-favorites', JSON.stringify(uniqueIds));
  }

  constructor(private modalCtrl: ModalController, private api: ApiService, private reviewService: ReviewService, private auth: AuthService) {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.api.products().pipe(
      timeout({ first: 10000 }),
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
        this.products.set([]);
        this.categories.set([]);
        this.categoryItems.set([]);
        this.error.set(this.getLoadError(error));
        return of({ products: [] as Product[], categoryItems: [] as ProductCategory[] });
      }),
      finalize(() => {
        this.loading.set(false);
      }),
    ).subscribe(({ products, categoryItems }) => {
      this.products.set(products);
      this.categoryItems.set(categoryItems);
        this.categories.set(['Fruits', 'Vegetables', 'Grains', 'Others']);
    });
  }

  private getLoadError(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'The products API did not respond within 10 seconds. Check the backend connection and try again.';
    }
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
    const fallback = this.productImageFallback(row.product_name);
    const apiImage = this.api.assetUrl(row.image_url);
    return {
      id: Number(row.product_id),
      name: row.product_name,
      category: this.resolveCategory(row.product_name, row.category?.category_name),
      price: Number(row.price),
      stockQuantity: Number(row.stock_quantity ?? 0),
      unit: row.unit,
      description: row.description ?? '',
      rating: 0,
      ...this.nutrition(row.product_name),
      image: apiImage ?? fallback?.url,
      fallbackImage: fallback?.url,
      fallbackImageCredit: fallback ? { text: fallback.creator, url: fallback.source } : undefined,
      imageCredit: fallback ? { text: fallback.creator, url: fallback.source } : undefined,
    };
  }

  handleImageError(product: Product) {
    if (product.fallbackImage && product.image !== product.fallbackImage) {
      product.image = product.fallbackImage;
      product.imageCredit = product.fallbackImageCredit;
      return;
    }
    product.image = undefined;
    product.imageCredit = undefined;
  }

  private productImageFallback(productName: string): { url: string; source: string; creator: string } | undefined {
    const key = productName.trim().toLowerCase().replace(/oes$/, 'o').replace(/ies$/, 'y').replace(/s$/, '');
    const image = this.missingProductImages[key];
    if (!image) return undefined;

    return {
      url: `/assets/images/products/${image.asset}`,
      source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image.sourceFile)}`,
      creator: image.creator,
    };
  }

  private resolveCategory(productName: string, apiCategory?: string | null): string {
    const category = apiCategory?.trim().toLowerCase();
    if (category === 'fruit' || category === 'fruits') return 'Fruits';
    if (category === 'vegetable' || category === 'vegetables' || category === 'vegtable' || category === 'vegatables') return 'Vegetables';
    if (category === 'grain' || category === 'grains') return 'Grains';

    const name = productName.trim().toLowerCase().replace(/oes$/, 'o').replace(/ies$/, 'y').replace(/s$/, '');
    const fruits = ['apple', 'strawberry', 'mango', 'blueberry', 'plum', 'pomelo', 'watermelon', 'grape', 'cantaloupe', 'longan', 'olive'];
    const vegetables = ['tomato', 'butternut squash', 'artichoke', 'bell pepper', 'habanero pepper', 'potato', 'onion', 'garlic'];
    const grains = ['rice', 'wheat', 'corn', 'barley', 'oat', 'rye', 'sorghum', 'millet', 'buckwheat', 'einkorn', 'teff'];

    if (fruits.includes(name)) return 'Fruits';
    if (vegetables.includes(name)) return 'Vegetables';
    if (grains.includes(name)) return 'Grains';
    return 'Others';
  }

  private nutrition(name: string) {
    const key = name.toLowerCase().replace(/oes$/, 'o').replace(/ies$/, 'y').replace(/s$/, '');
    const facts: Record<string, [number, number, number, number]> = {
      apple: [52, .3, 13.8, 4.6], strawberry: [32, .7, 7.7, 58.8], mango: [60, .8, 15, 36.4], blueberry: [57, .7, 14.5, 9.7], plum: [46, .7, 11.4, 9.5], pomelo: [38, .8, 9.6, 61], watermelon: [30, .6, 7.6, 8.1], grape: [69, .7, 18.1, 3.2], cantaloupe: [34, .8, 8.2, 36.7], longan: [60, 1.3, 15.1, 84], tomato: [18, .9, 3.9, 13.7], 'butternut squash': [45, 1, 11.7, 21], potato: [77, 2, 17.5, 19.7], artichoke: [47, 3.3, 10.5, 11.7], olive: [145, 1, 3.8, 0], onion: [40, 1.1, 9.3, 7.4], garlic: [149, 6.4, 33.1, 31.2], 'bell pepper': [31, 1, 6, 127.7], 'habanero pepper': [40, 1.9, 8.8, 24], rice: [130, 2.7, 28.2, 0], wheat: [339, 13.7, 71.1, 0], corn: [86, 3.3, 18.7, 6.8], barley: [354, 12.5, 73.5, 0], oat: [389, 16.9, 66.3, 0], rye: [338, 10.3, 75.9, 0], sorghum: [329, 11.3, 72.1, 0], millet: [378, 11, 72.9, 0], buckwheat: [343, 13.3, 71.5, 0], einkorn: [338, 18, 64, 0], teff: [367, 13.3, 73.1, 0],
    };
    const match = facts[key] ?? [0, 0, 0, 0];
    return { calories: match[0], protein: match[1], carbs: match[2], vitaminC: match[3] };
  }

  private readonly featuredNames = ['apple', 'strawberry', 'mango', 'blueberry'];
  private normalizeName(name: string) { return name.trim().toLowerCase().replace(/oes$/, 'o').replace(/ies$/, 'y').replace(/s$/, ''); }

  readonly featured = computed(() => {
    const all = this.products();
    const preferred = this.featuredNames
      .map((name) => all.find((product) => this.normalizeName(product.name) === name))
      .filter((product): product is Product => !!product);
    const flagged = all.filter((product) => product.featured && !preferred.some((item) => item.id === product.id));
    return [...preferred, ...flagged, ...all.filter((product) => !preferred.some((item) => item.id === product.id) && !flagged.some((item) => item.id === product.id))].slice(0, 4);
  });

  readonly popular = computed(() => {
    const all = this.products();
    const rated = all.map((product) => {
      const reviews = this.reviewService.forProduct(product.id);
      return { product, count: reviews.length, average: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0 };
    }).filter((item) => item.count > 0).sort((a, b) => b.average - a.average || b.count - a.count).map((item) => item.product);
    const curated = this.featured();
    return [...rated, ...curated.filter((product) => !rated.some((item) => item.id === product.id)), ...all.filter((product) => !rated.some((item) => item.id === product.id) && !curated.some((item) => item.id === product.id))].slice(0, 4);
  });

  isFeatured(product: Product) { return this.featured().some((item) => item.id === product.id); }
  isPopular(product: Product) { return this.popular().some((item) => item.id === product.id); }

  async openDetail(product: Product) {
    const modal = await this.modalCtrl.create({
      component: ProductDetailModal,
      componentProps: { product },
      cssClass: 'product-detail-modal',
      initialBreakpoint: 0.92,
      breakpoints: [0, 0.92],
      handle: true,
    });
    await modal.present();
  }
}
