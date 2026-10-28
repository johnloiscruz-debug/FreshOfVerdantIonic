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
  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // Start guests in the store and take an already signed-in admin to the dashboard.
    setTimeout(() => {
      void this.router.navigateByUrl(this.auth.isAdmin ? '/admin' : '/home', { replaceUrl: true });
    }, 2500);
  }
}
