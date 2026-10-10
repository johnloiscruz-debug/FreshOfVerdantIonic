import { Component } from '@angular/core';
import { IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, createOutline, star, starOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.page.html',
  styleUrls: ['./reviews.page.scss'],
  standalone: true,
  imports: [IonContent, IonFooter, IonIcon, PageHeaderComponent],
})
export class ReviewsPage {
  average = 4.8;
  total = 286;
  stars = [1, 2, 3, 4, 5];

  bars = [
    { star: 5, count: 232 },
    { star: 4, count: 34 },
    { star: 3, count: 12 },
    { star: 2, count: 5 },
    { star: 1, count: 3 },
  ];

  reviews = [
    { initials: 'ML', name: 'Maya Lim', rating: 5, date: 'Oct 2, 2026', text: 'Super fresh organic tomatoes, delivered right on time!' },
    { initials: 'AR', name: 'Anton Reyes', rating: 5, date: 'Sep 29, 2026', text: 'Crisp greens, careful packaging, and everything arrived chilled. My new weekly staple.' },
    { initials: 'SC', name: 'Sofia Cruz', rating: 5, date: 'Sep 24, 2026', text: 'The mangoes were perfectly ripe and sweet. Fresh of Verdant never disappoints.' },
  ];

  constructor() {
    addIcons({ checkmarkCircle, createOutline, star, starOutline });
  }

  pct(count: number) {
    return (count / this.total) * 100;
  }

  writeReview() {
    // TODO: open a form / modal
  }
}