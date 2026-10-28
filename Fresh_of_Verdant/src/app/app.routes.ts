import { Routes } from '@angular/router';
import { guestOnly, requireAccount, requireAdmin } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'folder/:folder',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then( m => m.SplashPage)
  },
  {
    path: 'login',
    canActivate: [guestOnly],
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    canActivate: [guestOnly],
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'auth/google/callback',
    loadComponent: () => import('./pages/login/google-auth-callback.page').then(m => m.GoogleAuthCallbackPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'admin',
    canActivate: [requireAdmin],
    loadComponent: () => import('./pages/admin/admin.page').then(({ AdminPage }) => AdminPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then( m => m.ProductsPage)
  },
  {
    path: 'categories',
    redirectTo: 'folder/categories',
    pathMatch: 'full'
  },
  {
    path: 'cart',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/cart/cart.page').then( m => m.CartPage)
  },
  {
    path: 'profile',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'wishlist',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/wishlist/wishlist.page').then((m) => m.WishlistPage)
  },
  {
    path: 'addresses',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/addresses/addresses.page').then((m) => m.AddressesPage)
  },
  {
    path: 'payment',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/payment/payment.page').then((m) => m.PaymentPage)
  },
  {
    path: 'cashless-wallet',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/cashless-wallet/cashless-wallet.page').then((m) => m.CashlessWalletPage)
  },
  {
    path: 'notifications',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/notifications/notifications.page').then((m) => m.NotificationsPage)
  },
  {
    path: 'settings',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage)
  },
  {
    path: 'security',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/security/security.page').then((m) => m.SecurityPage)
  },
  {
    path: 'orders',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/orders/orders.page').then( m => m.OrdersPage)
  },
  {
    path: 'reviews',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/reviews/reviews.page').then( m => m.ReviewsPage)
  },
  {
    path: 'checkout',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/checkout/checkout.page').then( m => m.CheckoutPage)
  },
  {
    path: 'order-tracker',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/order-tracker/order-tracker.page').then( m => m.OrderTrackerPage)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then( m => m.AboutPage)
  },
  {
    path: 'app-history',
    loadComponent: () => import('./pages/app-history/app-history.page').then(m => m.AppHistoryPage)
  },
  {
    path: 'about-services',
    loadComponent: () => import('./pages/about-services/about-services.page').then(m => m.AboutServicesPage)
  },
  {
    path: 'developers',
    loadComponent: () => import('./pages/developers/developers.page').then( m => m.DevelopersPage)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then( m => m.ContactPage)
  },
  {
    path: 'inbox',
    canActivate: [requireAccount],
    loadComponent: () => import('./pages/inbox/inbox.page').then(m => m.InboxPage)
  },
  {
    path: 'help-support',
    loadComponent: () => import('./pages/info/info.page').then((m) => m.InfoPage),
    data: { page: 'support' },
  },
  {
    path: 'location',
    loadComponent: () => import('./pages/info/info.page').then((m) => m.InfoPage),
    data: { page: 'location' },
  },
  {
    path: 'faqs',
    loadComponent: () => import('./pages/info/info.page').then((m) => m.InfoPage),
    data: { page: 'faqs' },
  },
  {
    path: 'policies',
    loadComponent: () => import('./pages/info/info.page').then((m) => m.InfoPage),
    data: { page: 'policies' },
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/info/info.page').then((m) => m.InfoPage),
    data: { page: 'terms' },
  },
];
