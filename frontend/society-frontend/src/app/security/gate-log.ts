import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Visitor, VisitorService } from '../core/visitor.service';
import { errorMessage } from '../core/error-message';

type Stage = 'WAITING' | 'READY' | 'INSIDE' | 'LEFT' | 'REJECTED';
type Filter = 'ALL' | Stage;

@Component({
  selector: 'app-gate-log',
  imports: [DatePipe],
  template: `
    <div class="header">
      <h2>Gate log</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">The 50 most recent visitors. This list refreshes itself every 20 seconds.</p>

    <div class="filters">
      @for (f of filters; track f.key) {
        <button type="button" class="chip" [class.on]="filter() === f.key" (click)="filter.set(f.key)">
          {{ f.label }} ({{ count(f.key) }})
        </button>
      }
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (v of filtered(); track v.id) {
        @let stage = stageOf(v);
        <div class="card">
          <div class="top">
            <strong>{{ v.visitorName }}</strong>
            <span class="badge" [class]="stage.toLowerCase()">{{ stageLabel(stage) }}</span>
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

          @if (stage === 'READY') {
            <button class="enter" [disabled]="busyId() === v.id" (click)="entry(v)">Record entry</button>
          }
          @if (stage === 'INSIDE') {
            <button class="exit" [disabled]="busyId() === v.id" (click)="exit(v)">Record exit</button>
          }
        </div>
      } @empty {
        <p>No visitors in this view.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .error { color: #c0392b; }
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
    .meta { color: #777777; font-size: 13px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .waiting { background: #fff3cd; color: #8a6d0b; }
    .ready { background: #d6e4ff; color: #1f3d7a; }
    .inside { background: #d4edda; color: #1e6b32; }
    .left { background: #e4e7ec; color: #4a5568; }
    .rejected { background: #f8d7da; color: #9b2c2c; }
    button { border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { padding: 7px 16px; background: #1f3864; }
    .enter, .exit { margin-top: 8px; padding: 8px 16px; }
    .enter { background: #2e8b57; }
    .exit { background: #b9770e; }
  `
})
export class GateLog {
  private visitorService = inject(VisitorService);
  private destroyRef = inject(DestroyRef);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'WAITING', label: 'Waiting for resident' },
    { key: 'READY', label: 'Ready to enter' },
    { key: 'INSIDE', label: 'Inside' }
  ];

  visitors = signal<Visitor[]>([]);
  filter = signal<Filter>('ALL');
  loading = signal(true);
  error = signal('');
  busyId = signal<number | null>(null);

  filtered = computed(() => {
    const current = this.filter();
    const all = this.visitors();
    return current === 'ALL' ? all : all.filter((v) => this.stageOf(v) === current);
  });

  constructor() {
    this.load(true);
    const timer = setInterval(() => this.load(false), 20000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.visitorService.recent().subscribe({
      next: (list) => {
        this.visitors.set(list);
        this.error.set('');
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  entry(visitor: Visitor) {
    this.act(visitor, this.visitorService.recordEntry(visitor.id));
  }

  exit(visitor: Visitor) {
    this.act(visitor, this.visitorService.recordExit(visitor.id));
  }

  stageOf(v: Visitor): Stage {
    if (v.status === 'REJECTED') {
      return 'REJECTED';
    }
    if (v.status === 'PENDING') {
      return 'WAITING';
    }
    if (v.exitTime) {
      return 'LEFT';
    }
    if (v.entryTime) {
      return 'INSIDE';
    }
    return 'READY';
  }

  stageLabel(stage: Stage): string {
    switch (stage) {
      case 'WAITING':
        return 'Waiting for resident';
      case 'READY':
        return 'Approved: ready to enter';
      case 'INSIDE':
        return 'Inside';
      case 'LEFT':
        return 'Left';
      default:
        return 'Rejected';
    }
  }

  count(key: Filter): number {
    const all = this.visitors();
    return key === 'ALL' ? all.length : all.filter((v) => this.stageOf(v) === key).length;
  }

  private act(visitor: Visitor, call: ReturnType<VisitorService['recordEntry']>) {
    this.busyId.set(visitor.id);
    this.error.set('');
    call.subscribe({
      next: (updated) => {
        this.visitors.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.busyId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.busyId.set(null);
        this.load(false);
      }
    });
  }
}