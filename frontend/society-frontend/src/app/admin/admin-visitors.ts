import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Visitor, VisitorService } from '../core/visitor.service';
import { Stage, stageLabel, stageOf } from '../core/visitor-stage';
import { errorMessage } from '../core/error-message';

type Filter = 'ALL' | Stage;

const SHOW_LIMIT = 100;

@Component({
  selector: 'app-admin-visitors',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="header">
      <h2>Visitor log</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">The newest 500 visitors. This view is read-only. Guards record entry and exit.</p>

    <div class="filters">
      @for (f of filters; track f.key) {
        <button type="button" class="chip" [class.on]="filter() === f.key" (click)="filter.set(f.key)">
          {{ f.label }} ({{ count(f.key) }})
        </button>
      }
      <input
        class="search"
        placeholder="Search visitor or flat"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (v of shown(); track v.id) {
        <div class="card">
          <div class="top">
            <strong>{{ v.visitorName }}</strong>
            <span class="badge" [class]="stage(v).toLowerCase()">{{ label(v) }}</span>
          </div>
          <p>Flat {{ v.flatLabel }} &middot; {{ v.purpose || 'No purpose given' }}</p>
          <p class="meta">Phone: {{ v.visitorPhone || '-' }}</p>
          <p class="meta">Registered: {{ v.createdAt | date: 'd MMM y, h:mm a' }}</p>
          @if (v.entryTime) {
            <p class="meta">Entered: {{ v.entryTime | date: 'd MMM y, h:mm a' }}</p>
          }
          @if (v.exitTime) {
            <p class="meta">Left: {{ v.exitTime | date: 'd MMM y, h:mm a' }}</p>
          }
        </div>
      } @empty {
        <p>No visitors in this view.</p>
      }

      @if (filtered().length > shown().length) {
        <p class="meta">Showing the first {{ shown().length }} of {{ filtered().length }}. Use the search box to narrow the list.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .error { color: #c0392b; }
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
    .search {
      flex: 1;
      min-width: 180px;
      max-width: 260px;
      padding: 8px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
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
      margin-bottom: 12px;
      padding: 12px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .card p { margin: 4px 0; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .meta { color: #777777; font-size: 13px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .waiting { background: #fff3cd; color: #8a6d0b; }
    .ready { background: #d6e4ff; color: #1f3d7a; }
    .inside { background: #d4edda; color: #1e6b32; }
    .left { background: #e4e7ec; color: #4a5568; }
    .rejected { background: #f8d7da; color: #9b2c2c; }
    .refresh { padding: 7px 16px; border: none; border-radius: 6px; background: #1f3864; color: #ffffff; cursor: pointer; }
  `
})
export class AdminVisitors {
  private visitorService = inject(VisitorService);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'WAITING', label: 'Waiting' },
    { key: 'READY', label: 'Approved' },
    { key: 'INSIDE', label: 'Inside' },
    { key: 'LEFT', label: 'Left' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  visitors = signal<Visitor[]>([]);
  filter = signal<Filter>('ALL');
  search = signal('');
  loading = signal(true);
  error = signal('');

  filtered = computed(() => {
    const current = this.filter();
    const query = this.search().trim().toLowerCase();
    return this.visitors().filter(
      (v) =>
        (current === 'ALL' || stageOf(v) === current) &&
        (!query ||
          v.visitorName.toLowerCase().includes(query) ||
          v.flatLabel.toLowerCase().includes(query))
    );
  });

  shown = computed(() => this.filtered().slice(0, SHOW_LIMIT));

  constructor() {
    this.load(true);
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.error.set('');
    this.visitorService.all().subscribe({
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

  stage(v: Visitor): Stage {
    return stageOf(v);
  }

  label(v: Visitor): string {
    return stageLabel(stageOf(v));
  }

  count(key: Filter): number {
    const all = this.visitors();
    return key === 'ALL' ? all.length : all.filter((v) => stageOf(v) === key).length;
  }
}