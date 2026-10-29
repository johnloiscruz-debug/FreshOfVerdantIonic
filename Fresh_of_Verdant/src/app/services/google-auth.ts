import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from './api';
import { AuthService } from './auth';
import { ProductService } from './product';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private initialized?: Promise<void>;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private products: ProductService,
  ) {}

  get isNativeGoogleAvailable(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  async signIn(): Promise<{ fullName: string; email: string; role: string }> {
    if (!this.isNativeGoogleAvailable) throw new Error('Native Google sign-in is only available on Android.');
    await this.initialize();

    const login = await SocialLogin.login({
      provider: 'google',
      options: { scopes: ['openid', 'email', 'profile'], style: 'standard', filterByAuthorizedAccounts: false },
    });
    const idToken = login.result.responseType === 'online' ? login.result.idToken : null;
    if (!idToken) throw new Error('Google did not return an identity token.');

    const session = await firstValueFrom(this.api.googleNativeLogin(idToken));
    this.auth.storeAccessToken(session.token);
    this.auth.signIn(session.user.email, session.user.fullName, session.user.role);
    this.products.connectWishlistToAccount();
    localStorage.setItem('fv-profile-details', JSON.stringify({
      'Full Name': session.user.fullName,
      'Email Address': session.user.email,
    }));
    return session.user;
  }

  async signOut(): Promise<void> {
    if (!this.isNativeGoogleAvailable) return;
    await this.initialize();
    await SocialLogin.logout({ provider: 'google' });
  }

  private initialize(): Promise<void> {
    this.initialized ??= SocialLogin.initialize({
      google: { webClientId: environment.googleWebClientId, mode: 'online' },
    });
    return this.initialized;
  }
}
