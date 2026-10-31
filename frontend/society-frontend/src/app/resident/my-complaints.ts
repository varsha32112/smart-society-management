import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { Complaint, ComplaintService, ComplaintStatus } from '../core/complaint.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-my-complaints',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="header">
      <h2>My Complaints</h2>
      <button class="refresh" type="button" (click)="load()">Refresh</button>
    </div>

    <form #f="ngForm" class="form" (ngSubmit)="submit(f)" novalidate>
      <h3>Raise a complaint</h3>

      <label for="title">Title</label>
      <input id="title" name="title" [(ngModel)]="title" required maxlength="150" #titleCtl="ngModel" />
      @if (titleCtl.invalid && (titleCtl.touched || f.submitted)) {
        <p class="field-error">Title is required</p>
      }

      <label for="description">Details (optional)</label>
      <textarea id="description" name="description" rows="4" maxlength="1000" [(ngModel)]="description"></textarea>

      @if (formError()) {
        <p class="field-error">{{ formError() }}</p>
      }
      @if (success()) {
        <p class="success">{{ success() }}</p>
      }

      <button class="submit" type="submit" [disabled]="sending()">
        {{ sending() ? 'Submitting...' : 'Submit complaint' }}
      </button>
    </form>

    <h3>History</h3>

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (c of complaints(); track c.id) {
        <div class="card">
          <div class="top">
            <strong>{{ c.title }}</strong>
            <span class="badge" [class]="c.status.toLowerCase()">{{ label(c.status) }}</span>
          </div>
          @if (c.description) {
            <p>{{ c.description }}</p>
          }
          <p class="meta">Raised: {{ c.createdAt | date: 'd MMM y, h:mm a' }}</p>
          @if (c.adminRemarks) {
            <p class="remarks"><strong>Admin remarks:</strong> {{ c.adminRemarks }}</p>
          }
        </div>
      } @empty {
        <p>You have not raised any complaints yet.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
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
    input, textarea {
      padding: 9px;
      margin-bottom: 12px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }
    .field-error { margin: 0 0 10px; color: #c0392b; font-size: 14px; }
    .success { margin: 0 0 10px; color: #1e6b32; font-size: 14px; }
    .card {
      max-width: 520px;
      margin-bottom: 14px;
      padding: 14px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .card p { margin: 6px 0; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .meta { color: #777777; font-size: 13px; }
    .remarks { padding: 8px 10px; background: #eef2f7; border-radius: 6px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .open { background: #fff3cd; color: #8a6d0b; }
    .in_progress { background: #d6e4ff; color: #1f3d7a; }
    .resolved { background: #d4edda; color: #1e6b32; }
    button { padding: 8px 16px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .submit { background: #2e8b57; align-self: flex-start; }
    .refresh { background: #1f3864; }
  `
})
export class MyComplaints {
  private complaintService = inject(ComplaintService);

  complaints = signal<Complaint[]>([]);
  loading = signal(true);
  loadError = signal('');
  formError = signal('');
  success = signal('');
  sending = signal(false);

  title = '';
  description = '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.loadError.set('');
    this.complaintService.myComplaints().subscribe({
      next: (list) => {
        this.complaints.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  submit(form: NgForm) {
    this.formError.set('');
    this.success.set('');

    const title = (this.title ?? '').trim();
    const description = (this.description ?? '').trim();

    if (form.invalid || !title) {
      this.formError.set('Please enter a title');
      return;
    }

    this.sending.set(true);
    this.complaintService.raise({ title, description }).subscribe({
      next: (created) => {
        this.complaints.update((list) => [created, ...list]);
        form.resetForm({ title: '', description: '' });
        this.sending.set(false);
        this.success.set('Your complaint has been submitted.');
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(errorMessage(err));
        this.sending.set(false);
      }
    });
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
}