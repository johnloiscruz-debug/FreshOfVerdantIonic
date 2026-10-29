import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, IonSpinner],
})
export class SplashPage implements OnInit, OnDestroy {
  welcomeBackName = '';
  isAdminWelcome = false;
  splashMode: 'welcome' | 'checkout' = 'welcome';
  private welcomeBackDestination = '';
  private transitionTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router, private auth: AuthService) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    this.welcomeBackName = typeof state?.['welcomeBackName'] === 'string' ? state['welcomeBackName'] : '';
    this.welcomeBackDestination = typeof state?.['welcomeBackDestination'] === 'string' ? state['welcomeBackDestination'] : '';
    this.splashMode = state?.['splashMode'] === 'checkout' ? 'checkout' : 'welcome';
    this.isAdminWelcome = this.auth.isAdmin && !!this.welcomeBackName;
  }

  ngOnInit() {
    this.transitionTimer = setTimeout(() => {
      if (this.splashMode === 'checkout') {
        void this.router.navigateByUrl('/checkout', { replaceUrl: true });
        return;
      }

      const safeDestination = this.welcomeBackDestination.startsWith('/') && !this.welcomeBackDestination.startsWith('//')
        ? this.welcomeBackDestination
        : '/home';
      const destination = this.auth.isAdmin ? '/admin' : (this.welcomeBackName ? safeDestination : '/home');
      void this.router.navigateByUrl(destination, { replaceUrl: true });
    }, this.splashMode === 'checkout' ? 850 : 2500);
  }

  ngOnDestroy() {
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
  }
}
