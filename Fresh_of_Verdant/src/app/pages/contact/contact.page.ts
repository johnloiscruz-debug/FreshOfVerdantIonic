import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, imageOutline, mailOutline, personOutline, pricetagOutline, sendOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { HeroHeaderComponent } from '../../components/hero-header/hero-header.component';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
  styleUrls: ['./contact.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, HeroHeaderComponent],
})
export class ContactPage {
  form = { name: '', email: '', subject: '', message: '' };

  constructor() {
    addIcons({ callOutline, imageOutline, mailOutline, personOutline, pricetagOutline, sendOutline, shieldCheckmarkOutline });
  }

  submit() {
    // TODO: send this.form to your API
    console.log(this.form);
  }
}