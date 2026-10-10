import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, compassOutline, leafOutline, locationOutline, mailOutline, nutritionOutline } from 'ionicons/icons';
import { HeroHeaderComponent } from '../../components/hero-header/hero-header.component';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, HeroHeaderComponent],
})
export class AboutPage {
  constructor() {
    addIcons({ callOutline, compassOutline, leafOutline, locationOutline, mailOutline, nutritionOutline });
  }
}