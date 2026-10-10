import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonCheckbox } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward, callOutline, chevronForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonCheckbox, FormsModule, RouterLink],
})
export class RegisterPage {
  form = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };
  agree = false;
  showPassword = false;
  showConfirm = false;

  constructor(private router: Router) {
    addIcons({ arrowForward, callOutline, chevronForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline, personOutline, shieldCheckmarkOutline });
  }

  register() {
    // TODO: validate + call your register API here
    this.router.navigateByUrl('/login');
  }
}