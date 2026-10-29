import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly emailKey = 'fv-auth-email';
  private readonly nameKey = 'fv-auth-name';
  private readonly roleKey = 'fv-auth-role';
  readonly currentUser = signal<string | null>(this.readEmail());
  readonly currentName = signal<string | null>(this.readName());
  readonly currentRole = signal<'Customer' | 'Admin'>(this.readRole());
  readonly adminCustomerMode = signal(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('fv-admin-customer-mode') === 'true');

  get isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  private readEmail(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(this.emailKey);
  }

  private readName(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(this.nameKey);
  }

  get isAdmin(): boolean {
    return this.currentRole() === 'Admin';
  }

  setAdminCustomerMode(enabled: boolean) {
    this.adminCustomerMode.set(enabled && this.isAdmin);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('fv-admin-customer-mode', String(enabled && this.isAdmin));
  }

  signIn(email: string, name?: string, role?: string) {
    const normalized = email.trim().toLowerCase();
    const displayName = name?.trim() || this.savedNameFor(normalized) || this.nameFromEmail(normalized);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.emailKey, normalized);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.nameKey, displayName);
    const accountRole = role?.toLowerCase() === 'admin' ? 'Admin' : 'Customer';
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.roleKey, accountRole);
    this.currentUser.set(normalized);
    this.currentName.set(displayName);
    this.currentRole.set(accountRole);
  }

  updateCurrentProfile(name: string, email: string) {
    const displayName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!displayName || !normalizedEmail) return;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.nameKey, displayName);
      sessionStorage.setItem(this.emailKey, normalizedEmail);
    }
    this.currentName.set(displayName);
    this.currentUser.set(normalizedEmail);
  }

  signOut() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.emailKey);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.nameKey);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.roleKey);
    this.currentUser.set(null);
    this.currentName.set(null);
    this.currentRole.set('Customer');
    this.adminCustomerMode.set(false);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('fv-admin-customer-mode');
    // These are account-specific device copies. Remove them before another account can use this session.
    if (typeof localStorage !== 'undefined') {
      ['fv-cart-items', 'fv-favorites', 'fv-order-history', 'fv-profile-details', 'fv-user-reviews'].forEach((key) => localStorage.removeItem(key));
    }
  }

  private readRole(): 'Customer' | 'Admin' {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(this.roleKey)?.toLowerCase() === 'admin' ? 'Admin' : 'Customer';
  }

  private savedNameFor(email: string): string | null {
    try {
      const profile = JSON.parse(localStorage.getItem('fv-profile-details') ?? '{}') as Record<string, unknown>;
      const savedEmail = typeof profile['Email Address'] === 'string' ? profile['Email Address'].toLowerCase() : '';
      const fullName = typeof profile['Full Name'] === 'string' ? profile['Full Name'].trim() : '';
      return savedEmail === email && fullName ? fullName : null;
    } catch {
      return null;
    }
  }

  private nameFromEmail(email: string): string {
    const localPart = email.split('@')[0] ?? '';
    return localPart.split(/[._-]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ') || 'there';
  }
}
