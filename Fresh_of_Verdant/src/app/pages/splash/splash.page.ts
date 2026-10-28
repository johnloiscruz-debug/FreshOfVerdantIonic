import { Component, OnInit } from '@angular/core';
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
export class SplashPage implements OnInit {
  welcomeBackName = '';
  isAdminWelcome = false;
  private welcomeBackDestination = '';

  constructor(private router: Router, private auth: AuthService) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    this.welcomeBackName = typeof state?.['welcomeBackName'] === 'string' ? state['welcomeBackName'] : '';
    this.welcomeBackDestination = typeof state?.['welcomeBackDestination'] === 'string' ? state['welcomeBackDestination'] : '';
    this.isAdminWelcome = this.auth.isAdmin && !!this.welcomeBackName;
  }

  ngOnInit() {
    // Show the login greeting briefly, then continue to the signed-in destination.
    setTimeout(() => {
      const safeDestination = this.welcomeBackDestination.startsWith('/') && !this.welcomeBackDestination.startsWith('//')
        ? this.welcomeBackDestination
        : '/home';
      const destination = this.auth.isAdmin ? '/admin' : (this.welcomeBackName ? safeDestination : '/home');
      void this.router.navigateByUrl(destination, { replaceUrl: true });
    }, 2500);
  }
}
