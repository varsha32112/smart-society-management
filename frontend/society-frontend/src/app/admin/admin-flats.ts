import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Flat, FlatInput, FlatService } from '../core/flat.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-admin-flats',
  imports: [FormsModule],
  template: `
    <div class="header">
      <h2>Flats</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">A flat that has residents, bills or visitors cannot be deleted.</p>

    <div class="form">
      <h3>{{ editingId() === null ? 'Add a flat' : 'Edit flat' }}</h3>

      <label for="block">Block</label>
      <input id="block" [(ngModel)]="blockName" maxlength="10" placeholder="e.g. A" />

      <label for="number">Flat number</label>
      <input id="number" [(ngModel)]="flatNumber" maxlength="10" placeholder="e.g. 101" />

      <label for="floor">Floor (optional)</label>
      <input id="floor" type="number" [(ngModel)]="floorNo" min="0" max="100" />

      @if (formError()) {
        <p class="field-error">{{ formError() }}</p>
      }
      @if (success()) {
        <p class="success">{{ success() }}</p>
      }

      <div class="actions">
        <button class="save" [disabled]="sending()" (click)="submit()">
          {{ sending() ? 'Saving...' : (editingId() === null ? 'Add flat' : 'Save changes') }}
        </button>
        @if (editingId() !== null) {
          <button class="cancel" (click)="cancelEdit()">Cancel</button>
        }
      </div>
    </div>

    <h3>All flats ({{ flats().length }})</h3>

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }
    @if (listError()) {
      <p class="field-error">{{ listError() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (f of flats(); track f.id) {
        <div class="card">
          <div class="info">
            <strong>{{ f.blockName }}-{{ f.flatNumber }}</strong>
            <span class="meta">{{ f.floorNo !== null ? 'Floor ' + f.floorNo : 'Floor not set' }}</span>
          </div>
          <div class="actions">
            <button class="edit" [disabled]="busyId() === f.id" (click)="startEdit(f)">Edit</button>
            <button class="delete" [disabled]="busyId() === f.id" (click)="remove(f)">Delete</button>
          </div>
        </div>
      } @empty {
        <p>No flats have been added yet.</p>
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
      max-width: 420px;
      margin-bottom: 10px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .info { display: flex; flex-direction: column; gap: 2px; }
    .meta { color: #777777; font-size: 13px; }
    .actions { display: flex; gap: 8px; }
    button { padding: 7px 14px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { background: #1f3864; }
    .save { background: #2e8b57; }
    .cancel { background: #7a869a; }
    .edit { background: #1f3864; }
    .delete { background: #c0392b; }
  `
})
export class AdminFlats {
  private flatService = inject(FlatService);

  flats = signal<Flat[]>([]);
  loading = signal(true);
  loadError = signal('');
  listError = signal('');
  formError = signal('');
  success = signal('');
  sending = signal(false);
  busyId = signal<number | null>(null);
  editingId = signal<number | null>(null);

  blockName = '';
  flatNumber = '';
  floorNo: number | null = null;

  constructor() {
    this.load(true);
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.loadError.set('');
    this.flatService.list().subscribe({
      next: (list) => {
        this.flats.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  startEdit(flat: Flat) {
    this.editingId.set(flat.id);
    this.blockName = flat.blockName;
    this.flatNumber = flat.flatNumber;
    this.floorNo = flat.floorNo;
    this.formError.set('');
    this.listError.set('');
    this.success.set('');
  }

  cancelEdit() {
    this.resetForm();
    this.formError.set('');
    this.success.set('');
  }

  submit() {
    this.formError.set('');
    this.listError.set('');
    this.success.set('');

    const block = (this.blockName ?? '').trim();
    const number = (this.flatNumber ?? '').trim();
    const floor = this.floorNo ?? null;

    if (!block) {
      this.formError.set('Block name is required');
      return;
    }
    if (block.length > 10) {
      this.formError.set('Block name must be 10 characters or fewer');
      return;
    }
    if (!number) {
      this.formError.set('Flat number is required');
      return;
    }
    if (number.length > 10) {
      this.formError.set('Flat number must be 10 characters or fewer');
      return;
    }
    if (floor !== null && (!Number.isInteger(floor) || floor < 0 || floor > 100)) {
      this.formError.set('Floor must be a whole number from 0 to 100');
      return;
    }

    const input: FlatInput = { blockName: block, flatNumber: number, floorNo: floor };
    const editingId = this.editingId();

    this.sending.set(true);
    const call =
      editingId === null ? this.flatService.add(input) : this.flatService.update(editingId, input);

    call.subscribe({
      next: () => {
        this.sending.set(false);
        this.resetForm();
        this.success.set(editingId === null ? 'Flat added.' : 'Flat updated.');
        this.load(false);
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(errorMessage(err));
        this.sending.set(false);
      }
    });
  }

  remove(flat: Flat) {
    if (!confirm(`Delete flat ${flat.blockName}-${flat.flatNumber}? This cannot be undone.`)) {
      return;
    }

    this.busyId.set(flat.id);
    this.listError.set('');
    this.formError.set('');
    this.success.set('');

    this.flatService.remove(flat.id).subscribe({
      next: () => {
        if (this.editingId() === flat.id) {
          this.resetForm();
        }
        this.busyId.set(null);
        this.success.set('Flat deleted.');
        this.load(false);
      },
      error: (err: HttpErrorResponse) => {
        this.listError.set(errorMessage(err));
        this.busyId.set(null);
      }
    });
  }

  private resetForm() {
    this.editingId.set(null);
    this.blockName = '';
    this.flatNumber = '';
    this.floorNo = null;
  }
}