import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { FamilyMember, FamilyService } from '../core/family.service';
import { errorMessage } from '../core/error-message';

const PHONE_PATTERN = /^[0-9+\- ]{7,15}$/;

@Component({
  selector: 'app-my-family',
  imports: [FormsModule],
  template: `
    <h2>My Family</h2>
    <p class="hint">People who live with you. Only you can see and change this list.</p>

    <form #f="ngForm" class="form" (ngSubmit)="submit(f)" novalidate>
      <h3>{{ editingId() === null ? 'Add a family member' : 'Edit family member' }}</h3>

      <label for="fullName">Full name</label>
      <input id="fullName" name="fullName" [(ngModel)]="fullName" required maxlength="100" #nameCtl="ngModel" />
      @if (nameCtl.invalid && (nameCtl.touched || f.submitted)) {
        <p class="field-error">Name is required</p>
      }

      <label for="relation">Relation (optional)</label>
      <input id="relation" name="relation" [(ngModel)]="relation" maxlength="30" placeholder="e.g. Wife, Son" />

      <label for="phone">Phone (optional)</label>
      <input id="phone" name="phone" [(ngModel)]="phone" maxlength="15" />
      @if (phoneError()) {
        <p class="field-error">{{ phoneError() }}</p>
      }

      @if (formError()) {
        <p class="field-error">{{ formError() }}</p>
      }
      @if (success()) {
        <p class="success">{{ success() }}</p>
      }

      <div class="actions">
        <button class="save" type="submit" [disabled]="sending()">
          {{ sending() ? 'Saving...' : (editingId() === null ? 'Add member' : 'Save changes') }}
        </button>
        @if (editingId() !== null) {
          <button class="cancel" type="button" (click)="cancelEdit(f)">Cancel</button>
        }
      </div>
    </form>

    <h3>Family members</h3>

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (m of members(); track m.id) {
        <div class="card">
          <div class="info">
            <strong>{{ m.fullName }}</strong>
            <span class="meta">{{ m.relation || '-' }} &middot; {{ m.phone || 'no phone' }}</span>
          </div>
          <div class="actions">
            <button class="edit" [disabled]="busyId() === m.id" (click)="startEdit(m)">Edit</button>
            <button class="delete" [disabled]="busyId() === m.id" (click)="remove(m)">Delete</button>
          </div>
        </div>
      } @empty {
        <p>No family members added yet.</p>
      }
    }
  `,
  styles: `
    .hint { color: #666666; margin-top: 0; }
    .form {
      display: flex;
      flex-direction: column;
      max-width: 520px;
      margin-bottom: 24px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .form h3 { margin: 0 0 12px; }
    label { margin-bottom: 4px; font-size: 14px; }
    input {
      padding: 9px;
      margin-bottom: 12px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
    .field-error { margin: 0 0 10px; color: #c0392b; font-size: 14px; }
    .success { margin: 0 0 10px; color: #1e6b32; font-size: 14px; }
    .card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 520px;
      margin-bottom: 12px;
      padding: 12px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .info { display: flex; flex-direction: column; gap: 2px; }
    .meta { color: #777777; font-size: 13px; }
    .actions { display: flex; gap: 8px; }
    button { padding: 7px 14px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .save { background: #2e8b57; }
    .cancel { background: #7a869a; }
    .edit { background: #1f3864; }
    .delete { background: #c0392b; }
  `
})
export class MyFamily {
  private familyService = inject(FamilyService);

  members = signal<FamilyMember[]>([]);
  loading = signal(true);
  loadError = signal('');
  formError = signal('');
  phoneError = signal('');
  success = signal('');
  sending = signal(false);
  busyId = signal<number | null>(null);
  editingId = signal<number | null>(null);

  fullName = '';
  relation = '';
  phone = '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.loadError.set('');
    this.familyService.list().subscribe({
      next: (list) => {
        this.members.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  startEdit(member: FamilyMember) {
    this.editingId.set(member.id);
    this.fullName = member.fullName;
    this.relation = member.relation ?? '';
    this.phone = member.phone ?? '';
    this.formError.set('');
    this.phoneError.set('');
    this.success.set('');
  }

  cancelEdit(form: NgForm) {
    this.resetForm(form);
    this.formError.set('');
    this.phoneError.set('');
    this.success.set('');
  }

  submit(form: NgForm) {
    this.formError.set('');
    this.phoneError.set('');
    this.success.set('');

    const fullName = (this.fullName ?? '').trim();
    const relation = (this.relation ?? '').trim();
    const phone = (this.phone ?? '').trim();

    let valid = true;
    if (form.invalid || !fullName) {
      this.formError.set('Please enter a name');
      valid = false;
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      this.phoneError.set('Phone must be 7 to 15 characters: digits, + - or spaces');
      valid = false;
    }
    if (!valid) {
      return;
    }

    const input = { fullName, relation: relation || null, phone: phone || null };
    const editingId = this.editingId();

    this.sending.set(true);
    const call =
      editingId === null
        ? this.familyService.add(input)
        : this.familyService.update(editingId, input);

    call.subscribe({
      next: (saved) => {
        this.members.update((list) =>
          editingId === null ? [...list, saved] : list.map((m) => (m.id === saved.id ? saved : m))
        );
        this.resetForm(form);
        this.sending.set(false);
        this.success.set(editingId === null ? 'Family member added.' : 'Family member updated.');
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(errorMessage(err));
        this.sending.set(false);
      }
    });
  }

  remove(member: FamilyMember) {
    if (!confirm(`Remove ${member.fullName} from your family list? This cannot be undone.`)) {
      return;
    }

    this.busyId.set(member.id);
    this.formError.set('');
    this.success.set('');

    this.familyService.remove(member.id).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== member.id));
        if (this.editingId() === member.id) {
          this.editingId.set(null);
          this.fullName = '';
          this.relation = '';
          this.phone = '';
        }
        this.busyId.set(null);
        this.success.set('Family member removed.');
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(errorMessage(err));
        this.busyId.set(null);
        this.load();
      }
    });
  }

  private resetForm(form: NgForm) {
    form.resetForm({ fullName: '', relation: '', phone: '' });
    this.editingId.set(null);
  }
}