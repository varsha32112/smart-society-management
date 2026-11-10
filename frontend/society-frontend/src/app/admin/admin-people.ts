import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PeopleService, Person } from '../core/people.service';
import { Flat, FlatService } from '../core/flat.service';
import { errorMessage } from '../core/error-message';

type Filter = 'ALL' | 'RESIDENT' | 'SECURITY' | 'HOUSEKEEPING' | 'INACTIVE';

const SHOW_LIMIT = 100;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^[0-9+\- ]{7,15}$/;

function passwordProblem(password: string): string {
  if (password.length < 8 || password.length > 72) {
    return 'Password must be 8 to 72 characters';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return '';
}

@Component({
  selector: 'app-admin-people',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="header">
      <h2>People</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">
      Create resident, security and housekeeping accounts, deactivate people who have left, and reset forgotten
      passwords. Admin accounts cannot be changed here.
    </p>

    <div class="form">
      <h3>Add a person</h3>

      <label for="role">Account type</label>
      <select id="role" [(ngModel)]="role">
        <option value="RESIDENT">Resident</option>
        <option value="SECURITY">Security guard</option>
        <option value="HOUSEKEEPING">Housekeeping staff</option>
      </select>

      <label for="fullName">Full name</label>
      <input id="fullName" [(ngModel)]="fullName" maxlength="100" />

      <label for="email">Email (used to log in)</label>
      <input id="email" type="email" [(ngModel)]="email" maxlength="120" autocomplete="off" />

      <label for="phone">Phone (optional)</label>
      <input id="phone" [(ngModel)]="phone" maxlength="15" />

      @if (role === 'RESIDENT') {
        <label for="flat">Flat</label>
        <select id="flat" [(ngModel)]="flatId">
          <option [ngValue]="null">Select a flat</option>
          @for (f of flats(); track f.id) {
            <option [ngValue]="f.id">{{ f.blockName }}-{{ f.flatNumber }}</option>
          }
        </select>
      }

      <label for="password">Temporary password</label>
      <input id="password" type="password" [(ngModel)]="password" maxlength="72" autocomplete="new-password" />
      <p class="meta">8 to 72 characters, with at least one letter and one number. Share it with the person securely.</p>

      @if (formError()) {
        <p class="field-error">{{ formError() }}</p>
      }
      <button class="primary" [disabled]="creating()" (click)="create()">
        {{ creating() ? 'Adding...' : 'Add person' }}
      </button>
    </div>

    @if (success()) {
      <p class="success">{{ success() }}</p>
    }
    @if (actionError()) {
      <p class="field-error">{{ actionError() }}</p>
    }

    <h3>Accounts</h3>

    <div class="filters">
      @for (f of filters; track f.key) {
        <button type="button" class="chip" [class.on]="filter() === f.key" (click)="filter.set(f.key)">
          {{ f.label }} ({{ count(f.key) }})
        </button>
      }
      <input
        class="search"
        placeholder="Search name, email or flat"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
    </div>

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (p of shown(); track p.id) {
        <div class="card">
          <div class="info">
            <strong>{{ p.fullName }}</strong>
            <span class="meta">{{ p.email }}{{ p.phone ? ' - ' + p.phone : '' }}</span>
            <span class="meta">{{ roleLabel(p) }}{{ p.flatLabel ? ' - Flat ' + p.flatLabel : '' }}</span>
            @if (p.createdAt) {
              <span class="meta">Added {{ p.createdAt | date: 'd MMM y' }}</span>
            }
          </div>

          <div class="side">
            <span class="badge" [class]="p.active ? 'active' : 'inactive'">{{ p.active ? 'Active' : 'Inactive' }}</span>
            @if (p.role !== 'ADMIN') {
              <div class="actions">
                <button
                  [class]="p.active ? 'danger' : 'good'"
                  [disabled]="busyId() === p.id"
                  (click)="toggleActive(p)"
                >
                  {{ p.active ? 'Deactivate' : 'Reactivate' }}
                </button>
                <button class="neutral" [disabled]="busyId() === p.id" (click)="startReset(p)">Reset password</button>
              </div>
            } @else {
              <span class="meta">Protected account</span>
            }
          </div>

          @if (resetId() === p.id) {
            <div class="panel">
              <label>New temporary password for {{ p.fullName }}</label>
              <input type="password" [(ngModel)]="resetPassword" maxlength="72" autocomplete="new-password" />
              @if (resetError()) {
                <p class="field-error">{{ resetError() }}</p>
              }
              <div class="actions">
                <button class="good" [disabled]="busyId() === p.id" (click)="saveReset(p)">Save password</button>
                <button class="neutral" (click)="cancelReset()">Cancel</button>
              </div>
            </div>
          }
        </div>
      } @empty {
        <p>No accounts in this view.</p>
      }

      @if (filtered().length > shown().length) {
        <p class="meta">Showing the first {{ shown().length }} of {{ filtered().length }}. Use the search box to narrow the list.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .form {
      display: flex;
      flex-direction: column;
      max-width: 420px;
      margin-bottom: 20px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .form h3 { margin: 0 0 12px; }
    label { margin-bottom: 4px; font-size: 14px; }
    input, select {
      padding: 9px;
      margin-bottom: 12px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
    .field-error { margin: 0 0 10px; color: #c0392b; font-size: 14px; }
    .success { margin: 0 0 10px; color: #1e6b32; font-size: 14px; }
    .meta { color: #777777; font-size: 13px; margin: 2px 0; }
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
    .search { margin: 0; flex: 1; min-width: 180px; max-width: 260px; }
    .chip {
      padding: 6px 12px;
      border: 1px solid #c4cdd8;
      border-radius: 16px;
      background: #ffffff;
      color: #1f3864;
      cursor: pointer;
      font-size: 13px;
    }
    .chip.on { background: #1f3864; color: #ffffff; border-color: #1f3864; }
    .card {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      max-width: 620px;
      margin-bottom: 12px;
      padding: 12px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .info { display: flex; flex-direction: column; gap: 2px; }
    .side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .actions { display: flex; gap: 8px; }
    .panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 12px;
      background: #f6f8fb;
      border-radius: 6px;
    }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .active { background: #d4edda; color: #1e6b32; }
    .inactive { background: #e4e7ec; color: #4a5568; }
    button { border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { padding: 7px 16px; background: #1f3864; }
    .primary { padding: 9px 16px; background: #2e8b57; align-self: flex-start; }
    .danger { padding: 6px 12px; background: #c0392b; }
    .good { padding: 6px 12px; background: #2e8b57; }
    .neutral { padding: 6px 12px; background: #1f3864; }
  `
})
export class AdminPeople {
  private peopleService = inject(PeopleService);
  private flatService = inject(FlatService);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'RESIDENT', label: 'Residents' },
    { key: 'SECURITY', label: 'Security' },
    { key: 'HOUSEKEEPING', label: 'Housekeeping' },
    { key: 'INACTIVE', label: 'Inactive' }
  ];

  people = signal<Person[]>([]);
  flats = signal<Flat[]>([]);
  filter = signal<Filter>('ALL');
  search = signal('');
  loading = signal(true);
  loadError = signal('');
  formError = signal('');
  actionError = signal('');
  success = signal('');
  creating = signal(false);
  busyId = signal<number | null>(null);
  resetId = signal<number | null>(null);
  resetError = signal('');

  role: 'RESIDENT' | 'SECURITY' | 'HOUSEKEEPING' = 'RESIDENT';
  fullName = '';
  email = '';
  phone = '';
  password = '';
  flatId: number | null = null;
  resetPassword = '';

  filtered = computed(() => {
    const current = this.filter();
    const query = this.search().trim().toLowerCase();
    return this.people().filter((p) => {
      const matchesFilter =
        current === 'ALL' ||
        (current === 'INACTIVE' ? !p.active : p.role === current);
      const matchesSearch =
        !query ||
        p.fullName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        (p.flatLabel ?? '').toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  });

  shown = computed(() => this.filtered().slice(0, SHOW_LIMIT));

  constructor() {
    this.load(true);
    this.flatService.list().subscribe({
      next: (list) => this.flats.set(list),
      error: (err: HttpErrorResponse) => this.loadError.set(errorMessage(err))
    });
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.loadError.set('');
    this.peopleService.list().subscribe({
      next: (list) => {
        this.people.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  count(key: Filter): number {
    const all = this.people();
    if (key === 'ALL') {
      return all.length;
    }
    return key === 'INACTIVE' ? all.filter((p) => !p.active).length : all.filter((p) => p.role === key).length;
  }

  roleLabel(p: Person): string {
    switch (p.role) {
      case 'ADMIN':
        return 'Admin';
      case 'RESIDENT':
        return 'Resident';
      case 'HOUSEKEEPING':
        return 'Housekeeping staff';
      default:
        return 'Security guard';
    }
  }

  create() {
    this.formError.set('');
    this.success.set('');
    this.actionError.set('');

    const fullName = (this.fullName ?? '').trim();
    const email = (this.email ?? '').trim().toLowerCase();
    const phone = (this.phone ?? '').trim();
    const password = this.password ?? '';

    let problem = '';
    if (!fullName) {
      problem = 'Full name is required';
    } else if (!email || !EMAIL_PATTERN.test(email) || email.length > 120) {
      problem = 'Please enter a valid email address';
    } else if (phone && !PHONE_PATTERN.test(phone)) {
      problem = 'Phone must be 7 to 15 characters: digits, + - or spaces';
    } else if (this.role === 'RESIDENT' && (this.flatId === null || this.flatId === undefined)) {
      problem = 'Please select a flat for the resident';
    } else {
      problem = passwordProblem(password);
    }
    if (problem) {
      this.formError.set(problem);
      return;
    }

    this.creating.set(true);
    this.peopleService
      .create({
        fullName,
        email,
        phone: phone || null,
        password,
        role: this.role,
        flatId: this.role === 'RESIDENT' ? this.flatId : null
      })
      .subscribe({
        next: (created) => {
          this.creating.set(false);
          this.fullName = '';
          this.email = '';
          this.phone = '';
          this.password = '';
          this.flatId = null;
          this.success.set(`${created.fullName} was added as ${this.roleLabel(created).toLowerCase()}. Share the temporary password securely.`);
          this.load(false);
        },
        error: (err: HttpErrorResponse) => {
          this.formError.set(errorMessage(err));
          this.creating.set(false);
        }
      });
  }

  toggleActive(person: Person) {
    const deactivating = person.active;
    const question = deactivating
      ? `Deactivate ${person.fullName}? They will be signed out and cannot log in until you reactivate them.`
      : `Reactivate ${person.fullName}? They will be able to log in again.`;
    if (!confirm(question)) {
      return;
    }

    this.busyId.set(person.id);
    this.success.set('');
    this.actionError.set('');

    this.peopleService.setActive(person.id, !deactivating).subscribe({
      next: (updated) => {
        this.people.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.busyId.set(null);
        this.success.set(`${updated.fullName} is now ${updated.active ? 'active' : 'inactive'}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.actionError.set(errorMessage(err));
        this.busyId.set(null);
        this.load(false);
      }
    });
  }

  startReset(person: Person) {
    this.resetId.set(person.id);
    this.resetPassword = '';
    this.resetError.set('');
    this.success.set('');
    this.actionError.set('');
  }

  cancelReset() {
    this.resetId.set(null);
    this.resetPassword = '';
    this.resetError.set('');
  }

  saveReset(person: Person) {
    const problem = passwordProblem(this.resetPassword ?? '');
    if (problem) {
      this.resetError.set(problem);
      return;
    }

    this.busyId.set(person.id);
    this.resetError.set('');

    this.peopleService.resetPassword(person.id, this.resetPassword).subscribe({
      next: () => {
        this.busyId.set(null);
        this.cancelReset();
        this.success.set(`Password for ${person.fullName} was reset. Share it with them securely.`);
      },
      error: (err: HttpErrorResponse) => {
        this.resetError.set(errorMessage(err));
        this.busyId.set(null);
      }
    });
  }
}