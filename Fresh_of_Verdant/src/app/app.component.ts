import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, IonIcon, IonMenuToggle } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, cartOutline, codeSlashOutline, gridOutline, helpCircleOutline, homeOutline, cubeOutline, logOutOutline, mailOutline, personOutline } from 'ionicons/icons';
import { filter } from 'rxjs';
import { CartService } from './services/cart';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonRouterOutlet, IonMenu, IonContent, IonIcon, IonMenuToggle],
})
export class AppComponent {
  // Menu items: change the title / url / icon here
  menuItems = [
    { title: 'Home / Dashboard', url: '/home', icon: 'home-outline' },
    { title: 'Product List', url: '/products', icon: 'cube-outline' },
    { title: 'Categories & Produce', url: '/folder/categories', icon: 'grid-outline' },
    { title: 'My Cart', url: '/cart', icon: 'cart-outline', badge: true },
    { title: 'About the App', url: '/about', icon: 'help-circle-outline' },
    { title: 'Developers Page', url: '/developers', icon: 'code-slash-outline' },
    { title: 'Contact Us', url: '/contact', icon: 'mail-outline' },
  ];

  showMenu = false;

  constructor(private router: Router, public cart: CartService) {
    addIcons({ callOutline, cartOutline, codeSlashOutline, gridOutline, helpCircleOutline, homeOutline, cubeOutline, logOutOutline, mailOutline, personOutline });

    // Hide the side menu on splash / login / register / reset password
    const noMenu = ['/splash', '/login', '/register', '/forgot-password'];
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.showMenu = !noMenu.some((p) => e.urlAfterRedirects.startsWith(p));
    });
  }

  logout() {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}