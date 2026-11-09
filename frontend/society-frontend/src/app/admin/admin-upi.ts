import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { UpiClaim, UpiService } from '../core/upi.service';
import { errorMessage } from '../core/error-message';

type Filter = 'ALL' | 'CLAIMED' | 'CONFIRMED' | 'REJECTED';

@Component({
  selector: 'app-admin-upi',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="header">
      <h2>UPI payment claims</h2>
      <button class="refresh" (click)="load(true)">Refresh</button>
    </div>
    <p class="hint">
      Residents who paid to the society's UPI ID enter their UPI reference (UTR) here. Check your bank statement for
      the same reference and amount before you confirm.
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
            <strong>{{ c.residentName }} &middot; Flat {{ c.flatLabel }}</strong>
            <span class="badge" [class]="c.status.toLowerCase()">{{ label(c) }}</span>
          </div>
          <p>{{ c.billMonth | date: 'MMMM y' }} &middot; <strong>{{ c.amount | currency: 'INR' : 'symbol' : '1.2-2' }}</strong></p>
          <p>UTR: <strong>{{ c.utr }}</strong></p>
          <p class="meta">Submitted {{ c.createdAt | date: 'd MMM y, h:mm a' }}</p>
          @if (c.decidedAt) {
            <p class="meta">Decided {{ c.decidedAt | date: 'd MMM y, h:mm a' }}</p>
          }
          @if (c.note) {
            <p class="meta">Reason: {{ c.note }}</p>
          }

          @if (c.status === 'CLAIMED') {
            <div class="actions">
              <button class="confirm" [disabled]="busyId() === c.id" (click)="confirm(c)">Confirm payment</button>
              <button class="reject" [disabled]="busyId() === c.id" (click)="reject(c)">Reject</button>
            </div>
          }
        </div>
      } @empty {
        <p>No claims in this view.</p>
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
    .meta { color: #777777; font-size: 13px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .claimed { background: #fff3cd; color: #8a6d0b; }
    .confirmed { background: #d4edda; color: #1e6b32; }
    .rejected { background: #f8d7da; color: #9b2c2c; }
    .actions { display: flex; gap: 8px; margin-top: 10px; }
    button { padding: 7px 16px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { background: #1f3864; }
    .confirm { background: #2e8b57; }
    .reject { background: #c0392b; }
  `
})
export class AdminUpi {
  private upiService = inject(UpiService);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'CLAIMED', label: 'Waiting' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL', label: 'All' }
  ];

  claims = signal<UpiClaim[]>([]);
  filter = signal<Filter>('CLAIMED');
  loading = signal(true);
  error = signal('');
  success = signal('');
  busyId = signal<number | null>(null);

  filtered = computed(() => {
    const current = this.filter();
    return current === 'ALL' ? this.claims() : this.claims().filter((c) => c.status === current);
  });

  constructor() {
    this.load(true);
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.error.set('');
    this.upiService.adminList().subscribe({
      next: (list) => {
        this.claims.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  count(key: Filter): number {
    const all = this.claims();
    return key === 'ALL' ? all.length : all.filter((c) => c.status === key).length;
  }

  label(c: UpiClaim): string {
    switch (c.status) {
      case 'CLAIMED':
        return 'Waiting for confirmation';
      case 'CONFIRMED':
        return 'Confirmed';
      default:
        return 'Rejected';
    }
  }

  confirm(claim: UpiClaim) {
    const question =
      `Check your bank statement first.\n\nDid you receive ₹${claim.amount.toFixed(2)} with reference ${claim.utr} ` +
      `for flat ${claim.flatLabel}?\n\nConfirming marks the bill as paid.`;
    if (!confirm(question)) {
      return;
    }
    this.decide(claim, this.upiService.confirm(claim.id), 'confirmed');
  }

  reject(claim: UpiClaim) {
    const reason = prompt('Why is this claim being rejected? The resident will see this reason.');
    if (reason === null || reason.trim() === '') {
      return;
    }
    this.decide(claim, this.upiService.reject(claim.id, reason.trim()), 'rejected');
  }

  private decide(claim: UpiClaim, call: ReturnType<UpiService['confirm']>, word: string) {
    this.busyId.set(claim.id);
    this.success.set('');
    this.error.set('');

    call.subscribe({
      next: (updated) => {
        this.claims.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        this.busyId.set(null);
        this.success.set(`The claim from ${updated.residentName} was ${word}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(errorMessage(err));
        this.busyId.set(null);
        this.load(false);
      }
    });
  }
}