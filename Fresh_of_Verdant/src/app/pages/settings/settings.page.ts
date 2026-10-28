import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, chevronForward, colorPaletteOutline, helpCircleOutline, languageOutline, locationOutline, notificationsOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { GreenHeaderComponent } from '../../components/green-header/green-header.component';

@Component({ selector: 'app-settings', templateUrl: './settings.page.html', styleUrls: ['./settings.page.scss'], standalone: true, imports: [CommonModule, IonContent, IonIcon, RouterLink, GreenHeaderComponent] })
export class SettingsPage {
  theme = localStorage.getItem('fv-theme') ?? 'green';
  language = localStorage.getItem('fv-language') ?? 'English';
  readonly themes = [
    { id: 'green', label: 'Default' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  constructor() {
    addIcons({ cardOutline, chevronForward, colorPaletteOutline, helpCircleOutline, languageOutline, locationOutline, notificationsOutline, personOutline, settingsOutline });
    this.applyTheme();
    this.applyLanguage();
  }

  setTheme(theme: string) {
    this.theme = theme;
    localStorage.setItem('fv-theme', theme);
    this.applyTheme();
  }

  setLanguage(event: Event) {
    this.language = (event.target as HTMLSelectElement).value;
    localStorage.setItem('fv-language', this.language);
    this.applyLanguage();
  }

  private applyTheme() {
    document.documentElement.classList.remove('theme-green', 'theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${this.theme}`);
  }

  private applyLanguage() {
    const languageCodes: Record<string, string> = { English: 'en', Filipino: 'fil', Dutch: 'nl' };
    document.documentElement.lang = languageCodes[this.language] ?? 'en';
  }
}
