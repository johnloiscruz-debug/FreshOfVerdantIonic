import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { Capacitor } from '@capacitor/core';
import { arrowForward, callOutline, closeOutline, eyeOffOutline, eyeOutline, leafOutline, lockClosedOutline, mailOutline, nutritionOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';
import { GoogleAuthService } from '../../services/google-auth';

@Component({
  selector: 'app-register-welcome-modal',
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
      <h1 id="welcome-title">Welcome to Fresh of Verdant!</h1>
      <p class="welcome-copy">Your account is ready. Discover fresh local picks, save your favorites, and enjoy easy ordering.</p>
      <div class="welcome-actions"><button class="ok-button" type="button" (click)="dismiss()">OK</button></div>
    </section>
  `,
  styleUrls: ['../../components/login-welcome-modal/login-welcome-modal.component.scss'],
})
class RegisterWelcomeModalComponent {
  constructor(private modalController: ModalController) { addIcons({ closeOutline, leafOutline }); }
  dismiss() { void this.modalController.dismiss(undefined, 'ok'); }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, RouterLink],
})
export class RegisterPage {
  form: { fullName: string; email: string; phone: string; password: string; confirmPassword: string; role: 'Customer' | 'Admin'; adminCode: string } = {
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'Customer', adminCode: '',
  };
  agree = false;
  showPassword = false;
  showConfirm = false;
  error = '';
  loading = false;
  readonly useNativeGoogleSignIn = Capacitor.getPlatform() === 'android';
  fieldErrors: Record<string, string> = {};
  private readonly maxNameLength = 80;
  private readonly maxEmailLength = 254;
  private readonly maxPasswordLength = 64;

  get googleAuthUrl() { return this.api.googleAuthUrl; }

  constructor(private router: Router, private api: ApiService, private auth: AuthService, private products: ProductService, private googleAuth: GoogleAuthService, private alertController: AlertController, private modalController: ModalController) {
    addIcons({ arrowForward, callOutline, closeOutline, eyeOffOutline, eyeOutline, leafOutline, lockClosedOutline, mailOutline, nutritionOutline, personOutline, shieldCheckmarkOutline });
  }

  async signInWithGoogle() {
    this.error = '';
    this.loading = true;
    try {
      await this.googleAuth.signIn();
      await this.showSuccessAndContinue();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unable to complete Google sign-in.';
      this.error = detail;
      await this.showAlert(detail);
    } finally {
      this.loading = false;
    }
  }

  register() {
    this.error = '';
    this.fieldErrors = this.validateForm();
    const firstError = Object.values(this.fieldErrors)[0];
    if (firstError) {
      this.error = firstError;
      void this.showAlert(firstError);
      return;
    }

    this.loading = true;
    this.api.register({ fullName: this.form.fullName.trim(), email: this.form.email.trim().toLowerCase(), password: this.form.password, phoneNumber: this.form.phone.trim(), role: this.form.role, adminCode: this.form.role === 'Admin' ? this.form.adminCode : undefined }).subscribe({
      next: ({ user }) => {
        localStorage.setItem('fv-profile-details', JSON.stringify({ 'Full Name': this.form.fullName.trim(), 'Email Address': this.form.email.trim().toLowerCase(), 'Mobile Number': this.form.phone.trim() }));
        this.auth.signIn(this.form.email, this.form.fullName, user?.role ?? this.form.role);
        this.products.connectWishlistToAccount();
        this.loading = false;
        void this.showSuccessAndContinue();
      },
      error: (err) => {
        this.error = err.error?.error ?? 'Unable to register. Check your connection and details.';
        this.loading = false;
        void this.showAlert(this.error);
      },
    });
  }

  clearFieldError(field: string) {
    delete this.fieldErrors[field];
    this.error = '';
  }

  private validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    const name = this.form.fullName.trim();
    const email = this.form.email.trim();
    const phone = this.form.phone.trim();
    const phoneDigits = phone.replace(/\D/g, '');

    if (!name) errors['fullName'] = 'Full Name is required.';
    else if (name.length < 2) errors['fullName'] = 'Full Name must be at least 2 characters.';
    else if (name.length > this.maxNameLength) errors['fullName'] = `Full Name must be ${this.maxNameLength} characters or fewer.`;
    else if (!/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(name)) errors['fullName'] = 'Use letters, spaces, apostrophes, periods, or hyphens in your name.';

    if (!email) errors['email'] = 'Email Address is required.';
    else if (email.length > this.maxEmailLength) errors['email'] = `Email Address must be ${this.maxEmailLength} characters or fewer.`;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors['email'] = 'Enter a valid email address.';

    if (!phone) errors['phone'] = 'Contact / Phone Number is required.';
    else if (!/^[+\d() .-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) errors['phone'] = 'Enter a valid phone number with 7 to 15 digits.';

    if (!this.form.password) errors['password'] = 'Password is required.';
    else if (this.form.password.length < 8) errors['password'] = 'Password must be at least 8 characters.';
    else if (this.form.password.length > this.maxPasswordLength) errors['password'] = `Password must be ${this.maxPasswordLength} characters or fewer.`;

    if (!this.form.confirmPassword) errors['confirmPassword'] = 'Confirm Password is required.';
    else if (this.form.password !== this.form.confirmPassword) errors['confirmPassword'] = 'Passwords do not match.';

    if (this.form.role === 'Admin' && this.form.adminCode !== 'admin') errors['adminCode'] = 'Enter the admin access code to create an Admin account.';

    if (!this.agree) errors['terms'] = 'Please agree to the Terms & Conditions.';
    return errors;
  }

  private async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Please check your details',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async showSuccessAndContinue() {
    const modal = await this.modalController.create({
      component: RegisterWelcomeModalComponent,
      cssClass: 'fv-login-welcome-modal',
      backdropDismiss: false,
    });
    await modal.present();
    await modal.onDidDismiss();
    await this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}
