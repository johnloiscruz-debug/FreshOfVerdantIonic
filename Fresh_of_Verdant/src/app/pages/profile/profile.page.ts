import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, cardOutline, checkmark, chevronForward, locationOutline, pencilOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, RouterLink, PageHeaderComponent],
})
export class ProfilePage {
  fields = [
    { label: 'FULL NAME', icon: 'person-outline', value: 'John Doe', type: 'text', editing: false },
    { label: 'PHONE NUMBER', icon: 'call-outline', value: '+63 917 555 0210', type: 'tel', editing: false },
    { label: 'DEFAULT DELIVERY ADDRESS', icon: 'location-outline', value: '24 Sampaguita St., Quezon City', type: 'text', editing: false },
  ];

  constructor() {
    addIcons({ callOutline, cardOutline, checkmark, chevronForward, locationOutline, pencilOutline, personOutline, shieldCheckmarkOutline });
  }

  save() {
    // TODO: send this.fields to your API
    this.fields.forEach((f) => (f.editing = false));
  }
}