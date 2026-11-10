import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Complaint, ComplaintService, ComplaintStatus } from '../core/complaint.service';
import { PeopleService, Person } from '../core/people.service';
import { errorMessage } from '../core/error-message';

type Filter = 'ALL' | ComplaintStatus;

const ORDER: ComplaintStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

@Component({
  selector: 'app-admin-complaints',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="header">
      <h2>Complaints</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">
      All complaints raised by residents. A complaint's status can only move forward. Assign a complaint to a
      housekeeping staff member to put it on their task list.
    </p>

    <div class="filters">
      @for (f of filters; track f.key) {
        <button type="button" class="chip" [class.on]="filter() === f.key" (click)="filter.set(f.key)">
          {{ f.label }} ({{ count(f.key) }})
        </button>
      }
    </div>

    @if (success()) {
      <p class="success">{{ success() }}</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (c of filtered(); track c.id) {
        <div class="card">
          <div class="top">
            <strong>{{ c.title }}</strong>
            <span class="badge" [class]="c.status.toLowerCase()">{{ label(c.status) }}</span>
          </div>
          <p class="who">{{ c.residentName }} &middot; Flat {{ c.flatLabel }}</p>
          @if (c.description) {
            <p>{{ c.description }}</p>
          }
          <p class="meta">Raised: {{ c.createdAt | date: 'd MMM y, h:mm a' }}</p>
          @if (c.adminRemarks) {
            <p class="remarks"><strong>Latest note:</strong> {{ c.adminRemarks }}</p>
          }

          @if (c.status !== 'RESOLVED') {
            <p class="assign">
              <label>Assigned to</label>
              <select [disabled]="assigningId() === c.id" (change)="assign(c, $any($event.target).value)">
                <option value="" [selected]="c.assignedToId === null">Unassigned</option>
                @for (s of staff(); track s.id) {
                  <option [value]="s.id" [selected]="s.id === c.assignedToId">{{ s.fullName }}</option>
                }
              </select>
            </p>
          } @else if (c.assignedToName) {
            <p class="meta">Handled by {{ c.assignedToName }}</p>
          }

          @if (c.status === 'RESOLVED') {
            <p class="meta">Closed</p>
          } @else if (editingId() === c.id) {
            <div class="panel">
              <label>New status</label>
              <select [(ngModel)]="newStatus">
                @for (s of options(c); track s) {
                  <option [value]="s">{{ label(s) }}</option>
                }
              </select>

              <label>Remarks for the resident (optional)</label>
              <textarea rows="3" maxlength="255" [(ngModel)]="remarks"></textarea>
              <p class="meta">{{ remarks.length }} / 255 characters. Leave empty to keep the previous remark.</p>

              @if (panelError()) {
                <p class="error">{{ panelError() }}</p>
              }

              <div class="actions">
                <button class="save" [disabled]="busyId() === c.id" (click)="save(c)">
                  {{ busyId() === c.id ? 'Saving...' : 'Save' }}
                </button>
                <button class="cancel" (click)="cancel()">Cancel</button>
              </div>
            </div>
          } @else {
            <button class="update" (click)="startUpdate(c)">Update</button>
          }
        </div>
      } @empty {
        <p>No complaints in this view.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .error { color: #c0392b; font-size: 14px; }
    .success { color: #1e6b32; font-size: 14px; }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
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
      max-width: 560px;
      margin-bottom: 14px;
      padding: 14px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .card p { margin: 4px 0; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .who { color: #444444; font-size: 14px; }
    .meta { color: #777777; font-size: 13px; }
    .remarks { padding: 8px 10px; background: #eef2f7; border-radius: 6px; }
    .assign { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .open { background: #fff3cd; color: #8a6d0b; }
    .in_progress { background: #d6e4ff; color: #1f3d7a; }
    .resolved { background: #d4edda; color: #1e6b32; }
    .panel {
      display: flex;
      flex-direction: column;
      margin-top: 10px;
      padding: 12px;
      background: #f6f8fb;
      border-radius: 6px;
    }
    label { margin-bottom: 4px; font-size: 14px; }
    select, textarea {
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }
    .assign select { margin-bottom: 0; }
    .actions { display: flex; gap: 8px; }
    button { border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { padding: 7px 16px; background: #1f3864; }
    .update { margin-top: 8px; padding: 7px 16px; background: #1f3864; }
    .save { padding: 7px 16px; background: #2e8b57; }
    .cancel { padding: 7px 16px; background: #7a869a; }
  `
})
export class AdminComplaints {
  private complaintService = inject(ComplaintService);
  private peopleService = inject(PeopleService);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'OPEN', label: 'Open' },
    { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'RESOLVED', label: 'Resolved' }
  ];

  complaints = signal<Complaint[]>([]);
  staff = signal<Person[]>([]);
  filter = signal<Filter>('ALL');
  loading = signal(true);
  error = signal('');
  success = signal('');
  panelError = signal('');
  busyId = signal<number | null>(null);
  assigningId = signal<number | null>(null);
  editingId = signal<number | null>(null);

  newStatus: ComplaintStatus = 'OPEN';
  remarks = '';

  filtered = computed(() => {
    const current = this.filter();
    const all = this.complaints();
    return current === 'ALL' ? all : all.filter((c) => c.status === current);
  });

  constructor() {
    this.load(true);
    this.peopleService.list().subscribe({
      next: (list) => this.staff.set(list.filter((p) => p.role === 'HOUSEKEEPING' && p.active)),
      error: () => this.staff.set([])
    });
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.error.set('');
    this.complaintService.all().subscribe({
      next: (list) => {
        this.complaints.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  count(key: Filter): number {
    const all = this.complaints();
    return key === 'ALL' ? all.length : all.filter((c) => c.status === key).length;
  }

  // Only the current status and later steps are offered, so it can only move forward.
  options(c: Complaint): ComplaintStatus[] {
    return ORDER.slice(ORDER.indexOf(c.status));
  }

  label(status: ComplaintStatus): string {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In progress';
      default:
        return 'Resolved';
    }
  }

  assign(c: Complaint, raw: string) {
    const userId = raw ? Number(raw) : null;
    if (userId === c.assignedToId) {
      return;
    }

    this.assigningId.set(c.id);
    this.error.set('');
    this.success.set('');

    this.complaintService.assign(c.id, userId).subscribe({
      next: (updated) => {
        this.complaints.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.assigningId.set(null);
        this.success.set(
          userId === null
            ? `Complaint "${updated.title}" is now unassigned.`
            : `Complaint "${updated.title}" assigned to ${updated.assignedToName}.`
        );
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.assigningId.set(null);
        this.load(false);
      }
    });
  }

  startUpdate(c: Complaint) {
    this.editingId.set(c.id);
    this.newStatus = c.status;
    this.remarks = '';
    this.panelError.set('');
    this.success.set('');
  }

  cancel() {
    this.editingId.set(null);
    this.panelError.set('');
  }

  save(c: Complaint) {
    this.panelError.set('');
    this.success.set('');

    const status = this.newStatus;
    const remarks = (this.remarks ?? '').trim();

    if (status === c.status && !remarks) {
      this.panelError.set('Choose a new status or write a remark');
      return;
    }
    if (
      status === 'RESOLVED' &&
      !confirm('Mark this complaint as resolved? A resolved complaint cannot be reopened.')
    ) {
      return;
    }

    this.busyId.set(c.id);
    this.complaintService.updateStatus(c.id, { status, adminRemarks: remarks || null }).subscribe({
      next: (updated) => {
        this.complaints.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.busyId.set(null);
        this.editingId.set(null);
        this.success.set(`Complaint "${updated.title}" updated.`);
      },
      error: (err: HttpErrorResponse) => {
        this.panelError.set(errorMessage(err));
        this.busyId.set(null);
        this.load(false);
      }
    });
  }
}