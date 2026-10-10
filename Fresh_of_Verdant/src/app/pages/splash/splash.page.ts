import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { nutritionOutline } from 'ionicons/icons';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner],
})
export class SplashPage implements OnInit {
  constructor(private router: Router) {
    addIcons({ nutritionOutline });
  }

  ngOnInit() {
    // Go to login after 2.5 seconds
    setTimeout(() => this.router.navigateByUrl('/login', { replaceUrl: true }), 2500);
  }
}