import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { gridOutline, searchOutline } from 'ionicons/icons';
import { GreenHeaderComponent } from '../components/green-header/green-header.component';
import { ProductService } from '../services/product';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, FormsModule, GreenHeaderComponent],
})
export class FolderPage {
  readonly folder = input.required<string>();
  search = '';

  constructor(public products: ProductService) {
    addIcons({ gridOutline, searchOutline });
  }

  get filteredCategories() {
    const query = this.search.trim().toLowerCase();
    return this.products.categoryItems().filter((category) =>
      !query || category.name.toLowerCase().includes(query) || category.description.toLowerCase().includes(query),
    );
  }
}
