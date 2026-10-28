import { Component } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, peopleOutline, personOutline, sparklesOutline } from 'ionicons/icons';
import { HeroHeaderComponent } from '../../components/hero-header/hero-header.component';
import { DeveloperTeamModalComponent, TeamMember } from '../../components/developer-team-modal/developer-team-modal.component';

@Component({
  selector: 'app-developers',
  templateUrl: './developers.page.html',
  styleUrls: ['./developers.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, HeroHeaderComponent],
})
export class DevelopersPage {
  animateEntrance = false;
  team: TeamMember[] = [
    { name: 'John Paulino', role: 'Leader', focus: 'Fresh of Verdant', photoUrl: 'https://cdn.phototourl.com/member/2026-10-22-a909004a-db8b-43d8-8489-9312135265ee.png', photoFailed: false },
    { name: 'Khyle Gamboa', role: 'Member', focus: 'Fresh of Verdant', photoUrl: 'https://cdn.phototourl.com/member/2026-10-22-64041d71-7c2e-4733-86aa-5d9246057618.png', photoFailed: false },
    { name: 'Iyad Ghazal', role: 'Member', focus: 'Fresh of Verdant', photoUrl: 'https://cdn.phototourl.com/member/2026-10-22-cf952cdc-1de2-47dc-aa24-48955a2c6091.png', photoFailed: false },
    { name: 'Reniel Jose', role: 'Member', focus: 'Fresh of Verdant', photoUrl: 'https://cdn.phototourl.com/member/2026-10-22-35bce0c0-1f9d-487a-95f6-1975a48e0303.png', photoFailed: false },
    { name: 'Carl Pardo', role: 'Member', focus: 'Fresh of Verdant', photoUrl: 'https://cdn.phototourl.com/member/2026-10-22-cc2cea81-38cf-4977-9470-dcf55438fe1e.png', photoFailed: false },
  ];

  constructor(private modalCtrl: ModalController) {
    addIcons({ chevronForward, peopleOutline, personOutline, sparklesOutline });
  }

  ionViewWillEnter() {
    this.animateEntrance = false;
    requestAnimationFrame(() => { this.animateEntrance = true; });
  }

  async openMember(index: number) {
    const modal = await this.modalCtrl.create({
      component: DeveloperTeamModalComponent,
      componentProps: { team: this.team, initialIndex: index },
      cssClass: 'developer-team-modal',
      breakpoints: [0, 0.8, 0.95, 1],
      initialBreakpoint: 0.95,
      handle: true,
    });
    await modal.present();
  }
}
