import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Visitor, VisitorService } from '../core/visitor.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-my-visitors',
  imports: [DatePipe],
  template: `
    <div class="header">
      <h2>My Visitors</h2>
      <button class="refresh" (click)="load()">Refresh</button>
    </div>
    <p class="hint">Visitors registered at the gate for your flat.</p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (v of visitors(); track v.id) {
        <div class="card">
          <div class="top">
            <strong>{{ v.visitorName }}</strong>
            <span class="badge" [class]="v.status.toLowerCase()">{{ v.status }}</span>
          </div>

          <p>Purpose: {{ v.purpose || '-' }}</p>
          <p>Phone: {{ v.visitorPhone || '-' }}</p>
          <p class="meta">Registered: {{ v.createdAt | date: 'd MMM y, h:mm a' }}</p>
          @if (v.entryTime) {
            <p class="meta">Entered: {{ v.entryTime | date: 'd MMM y, h:mm a' }}</p>
          }
          @if (v.exitTime) {
            <p class="meta">Left: {{ v.exitTime | date: 'd MMM y, h:mm a' }}</p>
          }

          @if (v.status === 'PENDING') {
            <div class="actions">
              <button class="approve" [disabled]="busyId() === v.id" (click)="decide(v, true)">Approve</button>
              <button class="reject" [disabled]="busyId() === v.id" (click)="decide(v, false)">Reject</button>
            </div>
          }
        </div>
      } @empty {
        <p>No visitors yet.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .error { color: #c0392b; }
    .card {
      max-width: 520px;
      margin-bottom: 14px;
      padding: 14px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .card p { margin: 4px 0; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .meta { color: #777777; font-size: 13px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .pending { background: #fff3cd; color: #8a6d0b; }
    .approved { background: #d4edda; color: #1e6b32; }
    .rejected { background: #f8d7da; color: #9b2c2c; }
    .actions { display: flex; gap: 10px; margin-top: 10px; }
    button { padding: 7px 16px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .approve { background: #2e8b57; }
    .reject { background: #c0392b; }
    .refresh { background: #1f3864; }
  `
})
export class MyVisitors {
  private visitorService = inject(VisitorService);

  visitors = signal<Visitor[]>([]);
  loading = signal(true);
  error = signal('');
  busyId = signal<number | null>(null);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.visitorService.myVisitors().subscribe({
      next: (list) => {
        this.visitors.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  decide(visitor: Visitor, approve: boolean) {
    this.busyId.set(visitor.id);
    this.error.set('');

    const call = approve
      ? this.visitorService.approve(visitor.id)
      : this.visitorService.reject(visitor.id);

    call.subscribe({
      next: (updated) => {
        this.visitors.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.busyId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.busyId.set(null);
        this.load();
      }
    });
  }

//   private messageFor(err: HttpErrorResponse): string {
//     const serverMessage = typeof err.error?.message === 'string' ? err.error.message : '';
//     if (serverMessage) {
//       return serverMessage;
//     }
//     if (err.status === 0) {
//       return 'Cannot reach the server. Please try again.';
//     }
//     return 'Something went wrong. Please try again.';
//   }
}