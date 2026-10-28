import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward, closeOutline, eyeOffOutline, eyeOutline, leafOutline, lockClosedOutline, mailOutline, nutritionOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-login-welcome-modal',
  standalone: true,
  imports: [IonIcon],
  template: `
    <section class="welcome-card" aria-labelledby="welcome-title">
      <button class="close-button" type="button" aria-label="Close welcome" (click)="dismiss()"><ion-icon name="close-outline"></ion-icon></button>
      <div class="welcome-brand">
        <img src="https://cdn.phototourl.com/member/2026-10-22-e0d176fe-0763-46fd-be92-ddac142cb10f.png" alt="Fresh of Verdant logo" />
        <span>Fresh of<strong>Verdant</strong></span>
      </div>
      <div class="welcome-mark"><ion-icon name="leaf-outline"></ion-icon></div>
      <p class="eyebrow">YOUR FRESH MARKET</p>
      <h1 id="welcome-title">Welcome Back to Fresh of Verdant!</h1>
      <p class="welcome-copy">We’re glad you’re here. Your fresh picks, local harvests, and easy ordering are ready when you are.</p>
      <div class="welcome-actions"><button class="ok-button" type="button" (click)="dismiss()">OK</button></div>
    </section>
  `,
  styleUrls: ['../../components/login-welcome-modal/login-welcome-modal.component.scss'],
})
class LoginWelcomeModalComponent {
  constructor(private modalController: ModalController) {
    addIcons({ closeOutline, leafOutline });
  }

  dismiss() { void this.modalController.dismiss(undefined, 'ok'); }
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, RouterLink],
})
export class LoginPage {
  email = '';
  password = '';
  remember = false;
  showPassword = false;
  error = '';
  loading = false;
  emailError = '';
  passwordError = '';

  get googleAuthUrl() { return this.api.googleAuthUrl; }

  constructor(private router: Router, private route: ActivatedRoute, private api: ApiService, private auth: AuthService, private products: ProductService, private alertController: AlertController, private modalController: ModalController) {
    addIcons({ arrowForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline });
  }

  signIn() {
    this.error = '';
    this.emailError = '';
    this.passwordError = '';
    const email = this.email.trim();
    if (!email) this.emailError = 'Email Address is required.';
    else if (email.length > 254) this.emailError = 'Email Address must be 254 characters or fewer.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) this.emailError = 'Enter a valid email address.';

    if (!this.password) this.passwordError = 'Password is required.';
    else if (this.password.length > 64) this.passwordError = 'Password must be 64 characters or fewer.';

    if (this.emailError || this.passwordError) {
      this.error = this.emailError || this.passwordError;
      void this.showAlert(this.error);
      return;
    }
    this.loading = true;
    this.api.login(email.toLowerCase(), this.password).subscribe({
      next: (user) => {
        const fullName = user.user?.fullName ?? user.fullName ?? user.name;
        this.auth.signIn(this.email, fullName, user.user?.role ?? user.role);
        this.products.connectWishlistToAccount();
        if (fullName) {
          localStorage.setItem('fv-profile-details', JSON.stringify({
            'Full Name': fullName,
            'Email Address': email.toLowerCase(),
          }));
        }
        const returnUrl = this.auth.isAdmin ? '/admin' : (this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home');
        void this.showWelcomeAndContinue(returnUrl, fullName || email.split('@')[0]);
      },
      error: (err) => {
        this.error = err.error?.error ?? 'Unable to sign in. Check your connection and details.';
        this.loading = false;
        void this.showAlert(this.error);
      },
    });
  }

  clearEmailError() { this.emailError = ''; this.error = ''; }
  clearPasswordError() { this.passwordError = ''; this.error = ''; }

  goToRegister() {
    void this.router.navigateByUrl('/register');
  }

  private async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Unable to sign in',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async showWelcomeAndContinue(returnUrl: string, fullName: string) {
    const modal = await this.modalController.create({
      component: LoginWelcomeModalComponent,
      cssClass: 'fv-login-welcome-modal',
      backdropDismiss: false,
    });
    await modal.present();
    await modal.onDidDismiss();
    const destination = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/home';
    await this.router.navigateByUrl('/splash', {
      replaceUrl: true,
      state: { welcomeBackName: fullName, welcomeBackDestination: destination },
    });
  }
}
