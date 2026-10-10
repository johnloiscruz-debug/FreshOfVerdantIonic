import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, peopleOutline, personOutline, sparklesOutline } from 'ionicons/icons';
import { HeroHeaderComponent } from '../../components/hero-header/hero-header.component';

@Component({
  selector: 'app-developers',
  templateUrl: './developers.page.html',
  styleUrls: ['./developers.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, HeroHeaderComponent],
})
export class DevelopersPage {
  team = [
    { name: 'John Lois', role: 'Product & UX Lead', focus: 'Research · product flows' },
    { name: 'Khyle', role: 'Mobile App Engineer', focus: 'React Native · accessibility' },
    { name: 'Iyad', role: 'Backend & API Engineer', focus: 'Services · data integrity' },
    { name: 'Reyniel', role: 'Quality Assurance Engineer', focus: 'Test systems · reliability' },
    { name: 'Carl', role: 'Cloud & DevOps Engineer', focus: 'Infrastructure · releases' },
  ];

  constructor() {
    addIcons({ chevronForward, peopleOutline, personOutline, sparklesOutline });
  }
}