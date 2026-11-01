import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Bill, MaintenanceService } from '../core/maintenance.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-my-bills',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="header">
      <h2>My Bills</h2>
      <button class="refresh" (click)="load()">Refresh</button>
    </div>
    <p class="hint">Maintenance bills for your flat. Payments are recorded by the society office.</p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @if (bills().length > 0) {
        <div class="summary">
          <span>Outstanding</span>
          <strong>{{ outstanding() | currency: 'INR' : 'symbol' : '1.2-2' }}</strong>
        </div>
      }

      @for (b of bills(); track b.id) {
        <div class="card">
          <div class="top">
            <strong>{{ b.billMonth | date: 'MMMM y' }}</strong>
            <span class="badge" [class]="b.status.toLowerCase()">{{ b.status === 'PAID' ? 'Paid' : 'Pending' }}</span>
          </div>
          <p class="amount">{{ b.amount | currency: 'INR' : 'symbol' : '1.2-2' }}</p>
          <p class="meta">Flat {{ b.flatLabel }}</p>
          @if (b.paidOn) {
            <p class="meta">Paid on {{ b.paidOn | date: 'd MMM y' }}</p>
          }
        </div>
      } @empty {
        <p>No bills have been generated for your flat yet.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .error { color: #c0392b; }
    .summary {
      display: flex;
      justify-content: space-between;
      max-width: 520px;
      margin-bottom: 16px;
      padding: 12px 18px;
      background: #eef2f7;
      border-radius: 8px;
    }
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
    .amount { font-size: 20px; font-weight: bold; }
    .meta { color: #777777; font-size: 13px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .pending { background: #fff3cd; color: #8a6d0b; }
    .paid { background: #d4edda; color: #1e6b32; }
    button { padding: 7px 16px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    .refresh { background: #1f3864; }
  `
})
export class MyBills {
  private maintenanceService = inject(MaintenanceService);

  bills = signal<Bill[]>([]);
  loading = signal(true);
  error = signal('');

  // Total of unpaid bills, added up in paise to avoid decimal rounding noise.
  outstanding = computed(() => {
    const paise = this.bills()
      .filter((b) => b.status === 'PENDING')
      .reduce((sum, b) => sum + Math.round(b.amount * 100), 0);
    return paise / 100;
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.maintenanceService.myBills().subscribe({
      next: (list) => {
        this.bills.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }
}