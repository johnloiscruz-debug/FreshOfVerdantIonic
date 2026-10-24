import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, createOutline, star, starOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ProductService } from '../../services/product';
import { ReviewService, UserReview } from '../../services/reviews';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.page.html',
  styleUrls: ['./reviews.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, FormsModule, PageHeaderComponent],
})
export class ReviewsPage {
  readonly stars = [1, 2, 3, 4, 5];
  showForm = false;
  author = '';
  rating = 0;
  text = '';
  productId: number | null = null;
  formError = '';
  submitted = false;
  submitting = false;

  constructor(public reviewService: ReviewService, public productService: ProductService, private auth: AuthService) {
    addIcons({ checkmarkCircle, createOutline, star, starOutline });
  }

  get reviews(): UserReview[] {
    return [...this.reviewService.reviews()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get total() { return this.reviews.length; }
  get average() { return this.total ? this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.total : 0; }

  get bars() {
    return this.stars.slice().reverse().map((star) => ({
      star,
      count: this.reviews.filter((review) => review.rating === star).length,
    }));
  }

  pct(count: number) { return this.total ? (count / this.total) * 100 : 0; }
  formatDate(date: string) { return new Date(date).toLocaleDateString(); }

  get profilePhoto() {
    const account = this.auth.currentUser()?.trim().toLowerCase() || 'guest';
    return localStorage.getItem(`fv-profile-photo:${account}`);
  }

  isCurrentUserReview(author: string) {
    const saved = this.auth.currentName() || (() => {
      try {
        const profile = JSON.parse(localStorage.getItem('fv-profile-details') ?? '{}') as Record<string, unknown>;
        return typeof profile['Full Name'] === 'string' ? profile['Full Name'] : '';
      } catch { return ''; }
    })();
    return !!saved && author.trim().toLocaleLowerCase() === saved.trim().toLocaleLowerCase();
  }

  initials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  submitReview() {
    this.formError = '';
    if (!this.auth.isAuthenticated) {
      this.formError = 'Sign in to submit a review.';
      return;
    }
    const name = this.author.trim();
    const reviewText = this.text.trim();
    if (!name || !reviewText || !this.rating) {
      this.formError = 'Add your name, choose a rating, and write your review.';
      return;
    }

    const product = this.productService.products().find((item) => item.id === this.productId) ?? null;
    this.submitting = true;
    this.reviewService.add({
      author: name,
      rating: this.rating,
      text: reviewText,
      productId: product?.id ?? null,
      productName: product?.name ?? null,
    }).subscribe({
      next: () => {
        this.author = '';
        this.rating = 0;
        this.text = '';
        this.productId = null;
        this.showForm = false;
        this.submitted = true;
        this.submitting = false;
      },
      error: (error: { status?: number }) => {
        this.formError = error.status === 401
          ? 'Sign in to submit a review.'
          : 'Could not submit your review. Please try again.';
        this.submitting = false;
      },
    });
  }
}
