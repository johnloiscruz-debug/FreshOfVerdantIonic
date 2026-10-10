import { Component, Input } from '@angular/core';
import { IonHeader, IonToolbar, IonMenuButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubbleEllipsesOutline, codeSlashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-hero-header',
  templateUrl: './hero-header.component.html',
  styleUrls: ['./hero-header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonMenuButton, IonIcon],
})
export class HeroHeaderComponent {
  @Input() eyebrow = 'FRESH OF VERDANT';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() rightIcon = '';

  constructor() {
    addIcons({ chatbubbleEllipsesOutline, codeSlashOutline });
  }
}