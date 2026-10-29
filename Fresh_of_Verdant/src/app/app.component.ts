import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AlertController, IonApp, IonRouterOutlet, IonMenu, IonContent, IonIcon, IonMenuToggle } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { briefcaseOutline, callOutline, cartOutline, codeSlashOutline, documentTextOutline, gridOutline, helpCircleOutline, headsetOutline, homeOutline, cubeOutline, logOutOutline, mailOutline, personOutline, heartOutline, receiptOutline, navigateOutline, locationOutline, shieldCheckmarkOutline, informationCircleOutline, chevronForward, settingsOutline, timeOutline, barChartOutline, pricetagOutline, storefrontOutline, starOutline } from 'ionicons/icons';
import { filter } from 'rxjs';
import { CartService } from './services/cart';
import { AuthService } from './services/auth';
import { ProductService } from './services/product';
import { ReviewService } from './services/reviews';
import { ApiService } from './services/api';
import { OrderHistoryService } from './services/order-history';
import { GoogleAuthService } from './services/google-auth';

interface MenuItem { title: string; url: string; icon: string; badge?: boolean; queryParams?: Record<string, string>; }
interface MenuGroup { title: string; items: MenuItem[]; }

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [RouterLink, IonApp, IonRouterOutlet, IonMenu, IonContent, IonIcon, IonMenuToggle],
})
export class AppComponent {
  // Menu items: change the title / url / icon here
  menuGroups: MenuGroup[] = [
    { title: 'Home', items: [{ title: 'Home / Dashboard', url: '/home', icon: 'home-outline' }, { title: 'Product List', url: '/products', icon: 'cube-outline' }] },
    { title: 'Market', items: [{ title: 'My Cart', url: '/cart', icon: 'cart-outline', badge: true }, { title: 'Wishlist', url: '/wishlist', icon: 'heart-outline' }, { title: 'My Orders', url: '/orders', icon: 'receipt-outline' }, { title: 'Delivery Track', url: '/order-tracker', icon: 'navigate-outline' }, { title: 'Help & Support', url: '/help-support', icon: 'headset-outline' }] },
    { title: 'Discover our App', items: [{ title: 'About the App', url: '/about', icon: 'information-circle-outline' }, { title: 'History of our App', url: '/app-history', icon: 'time-outline' }, { title: 'About Services', url: '/about-services', icon: 'briefcase-outline' }] },
    { title: 'Others', items: [{ title: 'View Profile', url: '/profile', icon: 'person-outline' }, { title: 'Inbox', url: '/inbox', icon: 'mail-outline' }, { title: 'Settings', url: '/settings', icon: 'settings-outline' }, { title: 'Location', url: '/location', icon: 'location-outline' }, { title: 'FAQs', url: '/faqs', icon: 'help-circle-outline' }, { title: 'Policies', url: '/policies', icon: 'shield-checkmark-outline' }, { title: 'Terms & Conditions', url: '/terms', icon: 'document-text-outline' }, { title: 'Contact us', url: '/contact', icon: 'mail-outline' }, { title: 'Developers', url: '/developers', icon: 'code-slash-outline' }] },
  ];

  adminMenuGroups: MenuGroup[] = [
    { title: 'Admin', items: [{ title: 'Admin Dashboard', url: '/admin', icon: 'grid-outline' }] },
  ];

  get activeMenuGroups(): MenuGroup[] {
    if (this.auth.isAdmin) return [...this.adminMenuGroups, ...this.menuGroups];
    if (!this.auth.isAuthenticated) {
      const guestOnlyItems = new Set(['/cart', '/wishlist', '/orders', '/order-tracker', '/inbox', '/profile']);
      return this.menuGroups.map((group) => ({ ...group, items: group.items.filter((item) => !guestOnlyItems.has(item.url)) }));
    }
    return this.menuGroups;
  }

  showMenu = false;

  private get savedProfile(): Record<string, unknown> {
    try {
      return JSON.parse(localStorage.getItem('fv-profile-details') ?? '{}') as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  get profileName() {
    const name = this.savedProfile['Full Name'];
    return typeof name === 'string' && name.trim() ? name.trim() : 'John Doe';
  }

  get profilePhone() {
    const phone = this.savedProfile['Mobile Number'];
    return typeof phone === 'string' && phone.trim() ? phone.trim() : '+63 917 555 0210';
  }

  get profileInitials() {
    const words = this.profileName.split(/\s+/).filter(Boolean);
    return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase() : (words[0]?.[0] ?? 'U').toUpperCase();
  }

  get profilePhoto() {
    const account = this.auth.currentUser()?.trim().toLowerCase() || 'guest';
    return localStorage.getItem(`fv-profile-photo:${account}`);
  }

  constructor(private router: Router, public cart: CartService, private alerts: AlertController, public auth: AuthService, private products: ProductService, private reviews: ReviewService, private api: ApiService, private orderHistory: OrderHistoryService, private googleAuth: GoogleAuthService) {
    addIcons({ briefcaseOutline, callOutline, cartOutline, codeSlashOutline, documentTextOutline, gridOutline, helpCircleOutline, headsetOutline, homeOutline, cubeOutline, logOutOutline, mailOutline, personOutline, heartOutline, receiptOutline, navigateOutline, locationOutline, shieldCheckmarkOutline, informationCircleOutline, chevronForward, settingsOutline, timeOutline, barChartOutline, pricetagOutline, storefrontOutline, starOutline });

    const savedTheme = localStorage.getItem('fv-theme');
    document.documentElement.classList.remove('theme-green', 'theme-light', 'theme-dark');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'green') {
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }

    // Hide the side menu on splash / login / register / reset password
    const noMenu = ['/splash', '/login', '/register', '/forgot-password'];
    this.showMenu = !noMenu.some((p) => this.router.url.startsWith(p));
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.showMenu = !noMenu.some((p) => e.urlAfterRedirects.startsWith(p));
      if (e.urlAfterRedirects.startsWith('/admin')) this.auth.setAdminCustomerMode(false);
    });

    if (this.auth.isAuthenticated || this.auth.hasStoredAccessToken) {
      this.api.account().subscribe({
        next: ({ user }) => {
          const savedProfile = this.savedProfile;
          this.auth.signIn(user.email, user.fullName, user.role);
          this.orderHistory.loadFromServer();
          this.products.connectWishlistToAccount();
          localStorage.setItem('fv-profile-details', JSON.stringify({
            'Full Name': user.fullName,
            'Email Address': user.email,
            'Mobile Number': user.phoneNumber ?? savedProfile['Mobile Number'] ?? '',
            'Location Address': user.shippingAddress ?? savedProfile['Location Address'] ?? '',
          }));
          if (user.role.toLowerCase() === 'admin' && !this.router.url.startsWith('/admin')) {
            void this.router.navigateByUrl('/admin', { replaceUrl: true });
          }
        },
        error: (error) => {
          if (error.status === 401 || error.status === 403) {
            this.auth.signOut();
            this.cart.clearForSignOut();
            this.products.clearFavoritesForSignOut();
            this.reviews.clearForSignOut();
            this.orderHistory.clearForSignOut();
            void this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        },
      });
    }
  }

  async logout() {
    const alert = await this.alerts.create({
      header: 'Log out?',
      message: 'Are you sure you want to log out?',
      buttons: [{ text: 'Log out', role: 'confirm' }, { text: 'Cancel', role: 'cancel' }],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      await this.googleAuth.signOut().catch((error) => console.warn('Google provider sign-out failed:', error));
      this.api.logout().subscribe({
        next: () => this.finishLogout(),
        error: () => this.finishLogout(),
      });
    }
  }

  private finishLogout() {
    this.auth.signOut();
    this.cart.clearForSignOut();
    this.products.clearFavoritesForSignOut();
    this.reviews.clearForSignOut();
    this.orderHistory.clearForSignOut();
    void this.router.navigateByUrl('/splash', { replaceUrl: true });
  }

  isMenuItemActive(item: MenuItem) {
    const [path, search = ''] = this.router.url.split('?');
    if (path !== item.url) return false;
    const currentParams = new URLSearchParams(search);
    const expectedParams = Object.entries(item.queryParams ?? {});
    if (expectedParams.length) return expectedParams.every(([key, value]) => currentParams.get(key) === value);
    const section = currentParams.get('section');
    return !section || section === 'dashboard';
  }

  prepareMenuNavigation(_url: string) {}
}
