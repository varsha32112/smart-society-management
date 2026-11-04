import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ReportService, ReportSummary } from '../core/report.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="header">
      <h2>Dashboard</h2>
      <div class="right">
        @if (updatedAt()) {
          <span class="meta">Updated {{ updatedAt() | date: 'h:mm:ss a' }}</span>
        }
        <button class="refresh" (click)="load(true)">Refresh</button>
      </div>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @if (data(); as d) {
        <div class="grid">
          <a class="panel" routerLink="/admin/visitors">
            <h3>Visitors</h3>
            <div class="stats">
              <div class="stat"><span class="num">{{ d.visitors.insideNow }}</span><span>Inside now</span></div>
              <div class="stat"><span class="num">{{ d.visitors.enteredToday }}</span><span>Entered today</span></div>
              <div class="stat" [class.alert]="d.visitors.pending > 0">
                <span class="num">{{ d.visitors.pending }}</span><span>Waiting for residents</span>
              </div>
              <div class="stat"><span class="num">{{ d.visitors.total }}</span><span>All time</span></div>
            </div>
          </a>

          <a class="panel" routerLink="/admin/complaints">
            <h3>Complaints</h3>
            <div class="stats">
              <div class="stat" [class.alert]="d.complaints.open > 0">
                <span class="num">{{ d.complaints.open }}</span><span>Open</span>
              </div>
              <div class="stat"><span class="num">{{ d.complaints.inProgress }}</span><span>In progress</span></div>
              <div class="stat"><span class="num">{{ d.complaints.resolved }}</span><span>Resolved</span></div>
            </div>
          </a>

          <a class="panel" routerLink="/admin/bills">
            <h3>Maintenance bills</h3>
            <div class="stats">
              <div class="stat" [class.alert]="d.billing.pendingBills > 0">
                <span class="num">{{ d.billing.pendingAmount | currency: 'INR' : 'symbol' : '1.2-2' }}</span>
                <span>Unpaid ({{ d.billing.pendingBills }} bills)</span>
              </div>
              <div class="stat">
                <span class="num">{{ d.billing.paidAmount | currency: 'INR' : 'symbol' : '1.2-2' }}</span>
                <span>Collected ({{ d.billing.paidBills }} bills)</span>
              </div>
            </div>
          </a>

          <a class="panel" routerLink="/admin/people">
            <h3>Society</h3>
            <div class="stats">
              <div class="stat"><span class="num">{{ d.society.flats }}</span><span>Flats</span></div>
              <div class="stat"><span class="num">{{ d.society.residents }}</span><span>Active residents</span></div>
              <div class="stat"><span class="num">{{ d.society.securityStaff }}</span><span>Security staff</span></div>
            </div>
          </a>
        </div>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .right { display: flex; align-items: center; gap: 12px; }
    .meta { color: #777777; font-size: 13px; }
    .error { color: #c0392b; }
    .grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .panel {
      width: 340px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
      color: inherit;
      text-decoration: none;
    }
    .panel:hover { border-color: #1f3864; }
    .panel h3 { margin: 0 0 12px; color: #1f3864; }
    .stats { display: flex; flex-wrap: wrap; gap: 12px; }
    .stat {
      display: flex;
      flex-direction: column;
      min-width: 130px;
      padding: 10px 12px;
      background: #f6f8fb;
      border-radius: 6px;
      font-size: 13px;
      color: #555555;
    }
    .stat.alert { background: #fff3cd; }
    .num { font-size: 22px; font-weight: bold; color: #1f3864; }
    button { padding: 7px 16px; border: none; border-radius: 6px; background: #1f3864; color: #ffffff; cursor: pointer; }
  `
})
export class AdminDashboard {
  private reportService = inject(ReportService);

  data = signal<ReportSummary | null>(null);
  loading = signal(true);
  error = signal('');
  updatedAt = signal<Date | null>(null);

  constructor() {
    this.load(true);
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.error.set('');
    this.reportService.summary().subscribe({
      next: (summary) => {
        this.data.set(summary);
        this.updatedAt.set(new Date());
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }
}