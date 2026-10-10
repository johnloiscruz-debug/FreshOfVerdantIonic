import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, checkmarkCircle, mailOutline, nutritionOutline, sendOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, RouterLink],
})
export class ForgotPasswordPage {
  email = '';
  sent = false;
  secondsLeft = 60;
  private timer: any;

  constructor() {
    addIcons({ arrowBack, checkmarkCircle, mailOutline, nutritionOutline, sendOutline });
  }

  sendLink() {
    // TODO: call your reset password API here
    this.sent = true;
    this.secondsLeft = 60;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) clearInterval(this.timer);
    }, 1000);
  }
}