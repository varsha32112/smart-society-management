import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComplaintStatus } from '../core/complaint.service';
import { HousekeepingService, Task } from '../core/housekeeping.service';
import { errorMessage } from '../core/error-message';

type Filter = 'ACTIVE' | 'DONE' | 'ALL';

@Component({
  selector: 'app-my-tasks',
  imports: [DatePipe],
  template: `
    <div class="header">
      <h2>My tasks</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">Jobs assigned to you by the society office. This list refreshes itself every 30 seconds.</p>

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
      @for (t of filtered(); track t.id) {
        <div class="card">
          <div class="top">
            <strong>{{ t.title }}</strong>
            <span class="badge" [class]="t.status.toLowerCase()">{{ label(t.status) }}</span>
          </div>
          <p class="where">Flat {{ t.flatLabel }}</p>
          @if (t.description) {
            <p>{{ t.description }}</p>
          }
          <p class="meta">Raised {{ t.createdAt | date: 'd MMM y, h:mm a' }}</p>
          @if (t.remarks) {
            <p class="remarks"><strong>Note:</strong> {{ t.remarks }}</p>
          }

          @if (t.status === 'OPEN') {
            <div class="actions">
              <button class="start" [disabled]="busyId() === t.id" (click)="start(t)">Start work</button>
              <button class="done" [disabled]="busyId() === t.id" (click)="done(t)">Mark done</button>
            </div>
          } @else if (t.status === 'IN_PROGRESS') {
            <div class="actions">
              <button class="done" [disabled]="busyId() === t.id" (click)="done(t)">Mark done</button>
            </div>
          }
        </div>
      } @empty {
        <p>No tasks in this view.</p>
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
      max-width: 520px;
      margin-bottom: 14px;
      padding: 14px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .card p { margin: 4px 0; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .where { font-weight: bold; color: #1f3864; }
    .meta { color: #777777; font-size: 13px; }
    .remarks { padding: 8px 10px; background: #eef2f7; border-radius: 6px; font-size: 14px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .open { background: #fff3cd; color: #8a6d0b; }
    .in_progress { background: #d6e4ff; color: #1f3d7a; }
    .resolved { background: #d4edda; color: #1e6b32; }
    .actions { display: flex; gap: 8px; margin-top: 10px; }
    button { padding: 7px 16px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { background: #1f3864; }
    .start { background: #3b6fd4; }
    .done { background: #2e8b57; }
  `
})
export class MyTasks {
  private housekeepingService = inject(HousekeepingService);
  private destroyRef = inject(DestroyRef);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ACTIVE', label: 'To do' },
    { key: 'DONE', label: 'Done' },
    { key: 'ALL', label: 'All' }
  ];

  tasks = signal<Task[]>([]);
  filter = signal<Filter>('ACTIVE');
  loading = signal(true);
  error = signal('');
  success = signal('');
  busyId = signal<number | null>(null);

  filtered = computed(() => {
    const current = this.filter();
    const all = this.tasks();
    if (current === 'ALL') {
      return all;
    }
    return all.filter((t) => (current === 'DONE' ? t.status === 'RESOLVED' : t.status !== 'RESOLVED'));
  });

  constructor() {
    this.load(true);
    const timer = setInterval(() => this.load(false), 30000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.housekeepingService.tasks().subscribe({
      next: (list) => {
        this.tasks.set(list);
        this.error.set('');
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  count(key: Filter): number {
    const all = this.tasks();
    if (key === 'ALL') {
      return all.length;
    }
    return all.filter((t) => (key === 'DONE' ? t.status === 'RESOLVED' : t.status !== 'RESOLVED')).length;
  }

  label(status: ComplaintStatus): string {
    switch (status) {
      case 'OPEN':
        return 'To do';
      case 'IN_PROGRESS':
        return 'In progress';
      default:
        return 'Done';
    }
  }

  start(task: Task) {
    this.update(task, 'IN_PROGRESS', null, `Started: ${task.title}`);
  }

  done(task: Task) {
    const note = prompt('Add a note about the work done (optional). Press Cancel to go back.');
    if (note === null) {
      return;
    }
    this.update(task, 'RESOLVED', note.trim() || null, `Marked done: ${task.title}`);
  }

  private update(task: Task, status: ComplaintStatus, remarks: string | null, message: string) {
    this.busyId.set(task.id);
    this.success.set('');
    this.error.set('');

    this.housekeepingService.update(task.id, status, remarks).subscribe({
      next: (updated) => {
        this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        this.busyId.set(null);
        this.success.set(message);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.busyId.set(null);
        this.load(false);
      }
    });
  }
}