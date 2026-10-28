import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonIcon } from '@ionic/angular';
import { NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { callOutline, cardOutline, checkmark, chevronForward, heartOutline, locateOutline, locationOutline, mailOutline, notificationsOutline, pencilOutline, personOutline, settingsOutline, shieldCheckmarkOutline, starOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ProductService } from '../../services/product';
import { ReviewService } from '../../services/reviews';
import { OrderHistoryService } from '../../services/order-history';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, NgIf, FormsModule, RouterLink, PageHeaderComponent],
})
export class ProfilePage {
  mapPinX = 50;
  mapPinY = 44;
  isDraggingMapPin = false;
  isLocating = false;
  profilePhoto: string | null = null;
  constructor(public products: ProductService, public reviewService: ReviewService, public orderHistory: OrderHistoryService, private alerts: AlertController, private router: Router, private auth: AuthService, private api: ApiService) {
    addIcons({ callOutline, cardOutline, checkmark, chevronForward, heartOutline, locateOutline, locationOutline, mailOutline, notificationsOutline, pencilOutline, personOutline, settingsOutline, shieldCheckmarkOutline, starOutline });
    this.loadSavedProfile();
    if (this.auth.isAuthenticated) {
      this.api.profileAvatar().subscribe({
        next: ({ avatarUrl }) => {
          if (avatarUrl) {
            this.profilePhoto = avatarUrl;
            localStorage.setItem(this.profilePhotoKey, avatarUrl);
          } else {
            const savedPhoto = localStorage.getItem(this.profilePhotoKey);
            if (savedPhoto?.startsWith('data:image/')) {
              this.api.saveProfileAvatar(savedPhoto).subscribe({
                next: ({ avatarUrl: savedAvatar }) => {
                  this.profilePhoto = savedAvatar;
                  localStorage.setItem(this.profilePhotoKey, savedAvatar);
                  this.reviewService.refresh();
                },
              });
            }
          }
        },
      });
    }
  }

  ionViewWillEnter() {
    if (this.auth.isAuthenticated) this.reviewService.refreshOwnCount();
    else this.reviewService.ownReviewCount.set(0);
  }

  fields = [
    { label: 'Full Name', icon: 'person-outline', value: 'John Doe', type: 'text', editing: false },
    { label: 'Email Address', icon: 'mail-outline', value: 'johndoe@email.com', type: 'email', editing: false },
    { label: 'Mobile Number', icon: 'call-outline', value: '+63 917 555 0210', type: 'tel', editing: false },
    { label: 'Location Address', icon: 'location-outline', value: '24 Sampaguita St., Quezon City', type: 'text', editing: false },
  ];

  get profileName() { return this.fields.find((field) => field.label === 'Full Name')?.value ?? ''; }
  get profileEmail() { return this.fields.find((field) => field.label === 'Email Address')?.value ?? ''; }
  private get profilePhotoKey() {
    const account = this.auth.currentUser()?.trim().toLowerCase() || 'guest';
    return `fv-profile-photo:${account}`;
  }

  async selectProfilePhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      await this.showLocationMessage('Choose a PNG or JPEG image for your profile photo.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      await this.showLocationMessage('Choose an image smaller than 8 MB.');
      return;
    }

    try {
      const dataUrl = await this.prepareProfilePhoto(file);
      if (this.auth.isAuthenticated) {
        this.api.saveProfileAvatar(dataUrl).subscribe({
          next: ({ avatarUrl }) => {
            localStorage.setItem(this.profilePhotoKey, avatarUrl);
            this.profilePhoto = avatarUrl;
            this.reviewService.refresh();
          },
          error: () => void this.showLocationMessage('Could not save your profile photo to your account. Please try again.'),
        });
      } else {
        localStorage.setItem(this.profilePhotoKey, dataUrl);
        this.profilePhoto = dataUrl;
      }
    } catch {
      await this.showLocationMessage('This photo could not be saved. Please choose another PNG or JPEG image.');
    }
  }

  private async prepareProfilePhoto(file: File): Promise<string> {
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image'));
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.readAsDataURL(file);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Invalid image'));
      element.src = source;
    });
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  }
  get profileInitials() {
    const words = this.profileName.trim().split(/\s+/).filter(Boolean);
    return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase() : (words[0]?.[0] ?? 'U').toUpperCase();
  }

  async save() {
    const phone = this.fields.find((field) => field.label === 'Mobile Number');
    if (phone) phone.value = this.formatPhone(phone.value);
    this.fields.forEach((f) => (f.editing = false));
    localStorage.setItem('fv-profile-details', JSON.stringify(Object.fromEntries(this.fields.map((field) => [field.label, field.value]))));
    const alert = await this.alerts.create({ message: 'Changes are Saved', buttons: ['OK'] });
    await alert.present();
  }

  phoneDigits(value: string) {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('63')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return digits.slice(0, 10);
  }

  updatePhone(value: string) {
    const phone = this.fields.find((field) => field.label === 'Mobile Number');
    if (phone) phone.value = `+63 ${this.phoneDigits(value)}`;
  }

  formatPhone(value: string) {
    const digits = this.phoneDigits(value);
    const formatted = digits.length > 7
      ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      : digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
    return `+63${formatted ? ` ${formatted}` : ''}`;
  }

  selectAddress(field: (typeof this.fields)[number]) {
    field.editing = false;
  }

  openAddresses() {
    void this.router.navigateByUrl('/addresses');
  }

  startMapPinDrag(event: PointerEvent) {
    event.preventDefault();
    this.isDraggingMapPin = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.moveMapPin(event);
  }

  moveMapPin(event: PointerEvent) {
    if (!this.isDraggingMapPin) return;
    const map = event.currentTarget as HTMLElement;
    const rect = map.getBoundingClientRect();
    this.mapPinX = Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100));
    this.mapPinY = Math.max(12, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100));

    const address = this.fields.find((field) => field.label === 'Location Address');
    if (address) address.value = this.mapAddress(this.mapPinX, this.mapPinY);
  }

  endMapPinDrag() {
    this.isDraggingMapPin = false;
  }

  async locateMe() {
    if (!navigator.geolocation) {
      await this.showLocationMessage('Location is not available in this browser. You can still drag the pin or enter an address.');
      return;
    }

    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      this.isLocating = false;
      this.mapPinX = 50;
      this.mapPinY = 44;
      const address = this.fields.find((field) => field.label === 'Location Address');
      if (address) address.value = `Current location (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`;
      await this.showLocationMessage('Your device location was detected. The sample map is illustrative, so enter a street address below if you need a readable delivery address.');
    }, async (error) => {
      this.isLocating = false;
      const message = error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Allow location access in your browser settings, or drag the pin and enter the address manually.'
        : 'Could not detect your location. Drag the pin or enter the address manually.';
      await this.showLocationMessage(message);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  private mapAddress(x: number, y: number) {
    const street = x < 46 || y > 58 ? 'Sampaguita St.' : 'Quezon Ave.';
    const number = Math.max(1, Math.round((y * 11 + x * 7) % 90));
    return `${number} ${street}, Quezon City`;
  }

  private async showLocationMessage(message: string) {
    const alert = await this.alerts.create({ message, buttons: ['OK'] });
    await alert.present();
  }

  private loadSavedProfile() {
    try {
      this.profilePhoto = localStorage.getItem(this.profilePhotoKey);
      const saved = JSON.parse(localStorage.getItem('fv-profile-details') ?? '{}') as Record<string, unknown>;
      this.fields.forEach((field) => {
        const value = saved[field.label];
        if (typeof value === 'string') field.value = value;
      });
    } catch {
      // Keep the default profile details if saved data is unavailable or invalid.
    }
  }
}
