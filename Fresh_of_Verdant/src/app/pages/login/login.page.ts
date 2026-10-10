import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonCheckbox } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api';

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
  error = '';
  loading = false;

  constructor(private router: Router, private api: ApiService) {
    addIcons({ arrowForward, eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline, nutritionOutline });
  }

  signIn() {
    this.error = '';
    this.loading = true;
    this.api.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/home', { replaceUrl: true }),
      error: (err) => {
        this.error = err.error?.error ?? 'Unable to sign in. Check your connection and details.';
        this.loading = false;
      },
    });
  }
}
