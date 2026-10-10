import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonHeader, IonToolbar, IonBackButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, ellipsisHorizontal, lockClosedOutline, optionsOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonBackButton, IonIcon],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() align: 'center' | 'left' = 'center';
  @Input() backHref = '/home';       // where Back goes if there is no history
  @Input() rightIcon = '';           // icon name, e.g. 'search-outline'
  @Input() rightLabel = '';          // small text under the right icon, e.g. '2 of 3'
  @Output() rightClick = new EventEmitter<void>();

  constructor() {
    // Any icon name passed in through rightIcon must be registered here
    addIcons({ arrowBack, ellipsisHorizontal, lockClosedOutline, optionsOutline, searchOutline });
  }
}