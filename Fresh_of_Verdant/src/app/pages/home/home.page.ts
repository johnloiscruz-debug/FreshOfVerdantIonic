import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonModal } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cartOutline, close, cubeOutline, imageOutline, personCircleOutline, sparklesOutline, star, starOutline } from 'ionicons/icons';
import { GreenHeaderComponent } from '../../components/green-header/green-header.component';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ReviewService, UserReview } from '../../services/reviews';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonModal, RouterLink, GreenHeaderComponent],
})
export class HomePage {
  @ViewChild('promoTrack') private promoTrack?: ElementRef<HTMLDivElement>;

  promoIndex = 0;
  showAppReviews = false;
  promos = [
    { tag: 'WEEKEND HARVEST', title: 'Save 20% on farm-fresh bundles', subtitle: 'Picked this morning. Delivered today.', image: 'assets/images/promos/harvest-bundle.jpg', alt: 'Autumn harvest fruits and vegetables' },
    { tag: 'GROWN NEARBY', title: 'Fresh greens for every table', subtitle: 'Find crisp local vegetables today.', image: 'assets/images/promos/fresh-market.jpg', alt: 'Colorful fresh vegetables at a market' },
    { tag: 'SWEET SEASON', title: 'Make room for something fresh', subtitle: 'Browse this week’s fruit picks.', image: 'assets/images/promos/fruit-and-veg.jpg', alt: 'Fresh fruits and vegetables on a dark surface' },
  ];

  constructor(public products: ProductService, private cart: CartService, private auth: AuthService, private reviewService: ReviewService, private api: ApiService) {
    addIcons({ cartOutline, close, cubeOutline, imageOutline, personCircleOutline, sparklesOutline, star, starOutline });
  }

  get appReviews(): UserReview[] { return this.reviewService.reviews().filter((review) => review.productId === null).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  get appRating() { return this.appReviews.length ? this.appReviews.reduce((sum, review) => sum + review.rating, 0) / this.appReviews.length : 0; }
  formatAppReviewDate(date: string) { return new Date(date).toLocaleDateString(); }

  reviewerPhoto(review: UserReview): string | null {
    if (review.authorAvatar) return this.api.assetUrl(review.authorAvatar) ?? review.authorAvatar;
    const currentName = this.auth.currentName()?.trim().toLocaleLowerCase();
    const account = this.auth.currentUser()?.trim().toLowerCase();
    if (!currentName || !account || review.author.trim().toLocaleLowerCase() !== currentName) return null;
    return localStorage.getItem(`fv-profile-photo:${account}`);
  }

  get greeting() {
    return this.auth.isAuthenticated ? `Welcome, ${this.auth.currentName() || 'there'}` : 'Welcome, Guest!';
  }

  open(product: Product) {
    this.products.openDetail(product);
  }

  addToCart(product: Product, event: Event) { event.stopPropagation(); this.cart.add(product, 1); }

  onPromoScroll() {
    const track = this.promoTrack?.nativeElement;
    if (track) this.promoIndex = Math.round(track.scrollLeft / track.clientWidth);
  }

  showPromo(index: number) {
    const track = this.promoTrack?.nativeElement;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  }
}
