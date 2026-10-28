import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-google-auth-callback',
  standalone: true,
  imports: [IonContent, RouterLink],
  template: `
    <ion-content [fullscreen]="true">
      <main class="callback-page">
        <img src="https://cdn.phototourl.com/member/2026-10-22-e0d176fe-0763-46fd-be92-ddac142cb10f.png" alt="Fresh of Verdant logo" />
        <h1>{{ error ? 'Google sign-in failed' : 'Finishing Google sign-in' }}</h1>
        <p>{{ error || 'Please wait while we connect your account.' }}</p>
        @if (error) { <a routerLink="/login">Back to sign in</a> }
      </main>
    </ion-content>
  `,
  styles: [`
    .callback-page { display:grid; min-height:100%; align-content:center; justify-items:center; padding:32px; text-align:center; background:#f1fbf5; }
    img { width:64px; height:64px; object-fit:contain; border-radius:16px; background:#fff; }
    h1 { margin:18px 0 6px; color:#173b27; font-size:22px; }
    p { margin:0; color:#66736b; font-size:14px; }
    a { margin-top:20px; color:var(--fv-green-dark); font-weight:700; text-decoration:none; }
  `],
})
export class GoogleAuthCallbackPage {
  error = '';

  constructor(api: ApiService, auth: AuthService, products: ProductService, router: Router) {
    api.account().subscribe({
      next: ({ user }) => {
        auth.signIn(user.email, user.fullName, user.role);
        products.connectWishlistToAccount();
        localStorage.setItem('fv-profile-details', JSON.stringify({
          'Full Name': user.fullName,
          'Email Address': user.email,
        }));
        void router.navigateByUrl(user.role.toLowerCase() === 'admin' ? '/admin' : '/home', { replaceUrl: true });
      },
      error: (failure) => {
        this.error = failure.error?.error || 'We could not verify your Google sign-in. Please try again.';
      },
    });
  }
}
