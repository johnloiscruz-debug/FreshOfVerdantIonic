import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline, mailOpenOutline, refreshOutline, timeOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ApiService, UserComplaint } from '../../services/api';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, RouterLink, PageHeaderComponent],
})
export class InboxPage implements OnInit {
  complaints: UserComplaint[] = [];
  loading = true;
  error = '';

  constructor(private api: ApiService) {
    addIcons({ alertCircleOutline, checkmarkCircleOutline, mailOpenOutline, refreshOutline, timeOutline });
  }

  ngOnInit() { this.loadInbox(); }

  loadInbox() {
    this.loading = true;
    this.error = '';
    this.api.myComplaints().subscribe({
      next: (rows) => { this.complaints = rows; this.loading = false; },
      error: (failure) => {
        this.loading = false;
        this.error = failure.status === 0
          ? 'Could not connect to Fresh of Verdant support. Check your connection and retry.'
          : failure.error?.error ?? 'Your inbox could not be loaded. Please retry.';
      },
    });
  }

  statusIcon(status: string) {
    return ['resolved', 'closed'].includes(status.toLowerCase()) ? 'checkmark-circle-outline' : 'time-outline';
  }

  hasResolution(complaint: UserComplaint) { return !!complaint.resolution?.trim(); }
}
