import { Component, Input } from '@angular/core';
import { IonContent, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, closeOutline, peopleOutline, personOutline } from 'ionicons/icons';

export interface TeamMember {
  name: string;
  role: string;
  focus: string;
  photoUrl: string;
  photoFailed: boolean;
}

@Component({
  selector: 'app-developer-team-modal',
  templateUrl: './developer-team-modal.component.html',
  styleUrls: ['./developer-team-modal.component.scss'],
  standalone: true,
  imports: [IonContent, IonIcon],
})
export class DeveloperTeamModalComponent {
  @Input() team: TeamMember[] = [];
  @Input() initialIndex = 0;
  activeIndex = 0;
  switching = false;

  constructor(private modalCtrl: ModalController) {
    addIcons({ chevronBackOutline, chevronForwardOutline, closeOutline, peopleOutline, personOutline });
  }

  ngOnInit() {
    this.activeIndex = Math.min(Math.max(this.initialIndex, 0), Math.max(this.team.length - 1, 0));
  }

  get member(): TeamMember | undefined { return this.team[this.activeIndex]; }

  selectMember(index: number) {
    if (index >= 0 && index < this.team.length && index !== this.activeIndex) {
      this.activeIndex = index;
      this.animateMemberChange();
    }
  }

  move(direction: number) {
    if (!this.team.length) return;
    this.activeIndex = (this.activeIndex + direction + this.team.length) % this.team.length;
    this.animateMemberChange();
  }

  private animateMemberChange() {
    this.switching = false;
    requestAnimationFrame(() => { this.switching = true; });
  }

  close() { void this.modalCtrl.dismiss(); }
}
