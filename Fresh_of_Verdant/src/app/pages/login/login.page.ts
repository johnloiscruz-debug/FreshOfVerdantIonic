import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonCheckbox } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonCheckbox, FormsModule, RouterLink],
})
export class LoginPage {
  email = '';
  password = '';
  remember = false;
  showPassword = false;

  constructor(private router: Router) {
    addIcons({ arrowForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline });
  }

  signIn() {
    // TODO: call your login API here
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}