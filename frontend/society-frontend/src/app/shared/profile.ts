import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Person } from '../core/people.service';
import { ProfileService } from '../core/profile.service';
import { PHONE_PATTERN, passwordProblem } from '../core/validation';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, DatePipe],
  template: `
    <h2>My profile</h2>

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @if (profile(); as p) {
        <div class="card">
          <h3>Account</h3>
          <p class="row"><span>Email</span><strong>{{ p.email }}</strong></p>
          <p class="row"><span>Role</span><strong>{{ roleLabel(p) }}</strong></p>
          @if (p.flatLabel) {
            <p class="row"><span>Flat</span><strong>{{ p.flatLabel }}</strong></p>
          }
          @if (p.createdAt) {
            <p class="row"><span>Member since</span><strong>{{ p.createdAt | date: 'd MMM y' }}</strong></p>
          }
          <p class="meta">Your email is your login name. To change it, please contact the society office.</p>
        </div>

        <div class="card form">
          <h3>My details</h3>

          <label for="fullName">Full name</label>
          <input id="fullName" [(ngModel)]="fullName" maxlength="100" />

          <label for="phone">Phone (optional)</label>
          <input id="phone" [(ngModel)]="phone" maxlength="15" />

          @if (detailsError()) {
            <p class="field-error">{{ detailsError() }}</p>
          }
          @if (detailsSuccess()) {
            <p class="success">{{ detailsSuccess() }}</p>
          }
          <button class="primary" [disabled]="savingDetails()" (click)="saveDetails()">
            {{ savingDetails() ? 'Saving...' : 'Save details' }}
          </button>
        </div>

        <div class="card form">
          <h3>Change password</h3>

          <label for="current">Current password</label>
          <input id="current" type="password" [(ngModel)]="currentPassword" maxlength="72" autocomplete="current-password" />

          <label for="new">New password</label>
          <input id="new" type="password" [(ngModel)]="newPassword" maxlength="72" autocomplete="new-password" />
          <p class="meta">8 to 72 characters, with at least one letter and one number.</p>

          <label for="confirm">Confirm new password</label>
          <input id="confirm" type="password" [(ngModel)]="confirmPassword" maxlength="72" autocomplete="new-password" />

          @if (passwordError()) {
            <p class="field-error">{{ passwordError() }}</p>
          }
          @if (passwordSuccess()) {
            <p class="success">{{ passwordSuccess() }}</p>
          }
          <button class="primary" [disabled]="changing()" (click)="changePassword()">
            {{ changing() ? 'Changing...' : 'Change password' }}
          </button>
        </div>
      }
    }
  `,
  styles: `
    .card {
      max-width: 460px;
      margin-bottom: 20px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .card h3 { margin: 0 0 12px; }
    .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
    .row span { color: #666666; }
    .form { display: flex; flex-direction: column; }
    label { margin-bottom: 4px; font-size: 14px; }
    input {
      padding: 9px;
      margin-bottom: 12px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
    .meta { color: #777777; font-size: 13px; margin: 2px 0 12px; }
    .field-error { margin: 0 0 10px; color: #c0392b; font-size: 14px; }
    .success { margin: 0 0 10px; color: #1e6b32; font-size: 14px; }
    button { border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .primary { padding: 9px 16px; background: #2e8b57; align-self: flex-start; }
  `
})
export class Profile {
  private profileService = inject(ProfileService);
  private auth = inject(AuthService);

  profile = signal<Person | null>(null);
  loading = signal(true);
  loadError = signal('');

  detailsError = signal('');
  detailsSuccess = signal('');
  savingDetails = signal(false);

  passwordError = signal('');
  passwordSuccess = signal('');
  changing = signal(false);

  fullName = '';
  phone = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor() {
    this.profileService.get().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.fullName = p.fullName;
        this.phone = p.phone ?? '';
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  roleLabel(p: Person): string {
    switch (p.role) {
      case 'ADMIN':
        return 'Admin';
      case 'RESIDENT':
        return 'Resident';
      default:
        return 'Security guard';
    }
  }

  saveDetails() {
    this.detailsError.set('');
    this.detailsSuccess.set('');

    const fullName = (this.fullName ?? '').trim();
    const phone = (this.phone ?? '').trim();

    if (!fullName) {
      this.detailsError.set('Full name is required');
      return;
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      this.detailsError.set('Phone must be 7 to 15 characters: digits, + - or spaces');
      return;
    }

    this.savingDetails.set(true);
    this.profileService.update({ fullName, phone: phone || null }).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.fullName = updated.fullName;
        this.phone = updated.phone ?? '';
        this.auth.updateSavedName(updated.fullName);
        this.savingDetails.set(false);
        this.detailsSuccess.set('Your details were saved.');
      },
      error: (err: HttpErrorResponse) => {
        this.detailsError.set(errorMessage(err));
        this.savingDetails.set(false);
      }
    });
  }

  changePassword() {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    const current = this.currentPassword ?? '';
    const next = this.newPassword ?? '';
    const confirm = this.confirmPassword ?? '';

    if (!current) {
      this.passwordError.set('Please enter your current password');
      return;
    }
    const problem = passwordProblem(next);
    if (problem) {
      this.passwordError.set(problem);
      return;
    }
    if (next === current) {
      this.passwordError.set('New password must be different from the current password');
      return;
    }
    if (next !== confirm) {
      this.passwordError.set('The two new passwords do not match');
      return;
    }

    this.changing.set(true);
    this.profileService.changePassword(current, next).subscribe({
      next: () => {
        this.changing.set(false);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordSuccess.set('Password changed. Signing you out so you can log in with the new password...');
        setTimeout(() => this.auth.logout(), 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.passwordError.set(errorMessage(err));
        this.changing.set(false);
      }
    });
  }
}