import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api';

export interface UserReview {
  id: string;
  author: string;
  rating: number;
  createdAt: string;
  text: string;
  productId: number | null;
  productName: string | null;
  authorAvatar?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  readonly reviews = signal<UserReview[]>([]);
  readonly ownReviewCount = signal(0);
  readonly loading = signal(false);
  readonly loadError = signal('');

  constructor(private api: ApiService) {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.reviews().subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loadError.set('');
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load reviews. Please try again.');
        this.loading.set(false);
      },
    });
  }

  refreshOwnCount() {
    this.api.myReviewCount().subscribe({
      next: ({ count }) => this.ownReviewCount.set(Number.isSafeInteger(count) && count >= 0 ? count : 0),
    });
  }

  add(review: Omit<UserReview, 'id' | 'createdAt'>): Observable<UserReview> {
    return this.api.createReview(review).pipe(tap((saved) => {
      this.reviews.update((current) => [saved, ...current]);
      this.ownReviewCount.update((count) => count + 1);
      this.loadError.set('');
    }));
  }

  forProduct(productId: number): UserReview[] {
    return this.reviews().filter((review) => review.productId === productId);
  }

  clearForSignOut() {
    this.ownReviewCount.set(0);
    this.refresh();
  }
}
