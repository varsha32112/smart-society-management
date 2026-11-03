import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Bill, BillStatus, MaintenanceService } from '../core/maintenance.service';
import { Flat, FlatService } from '../core/flat.service';
import { errorMessage } from '../core/error-message';

type Filter = 'ALL' | BillStatus;

const SHOW_LIMIT = 100;

@Component({
  selector: 'app-admin-bills',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header">
      <h2>Maintenance bills</h2>
      <button class="refresh" (click)="loadBills(true)">Refresh</button>
    </div>
    <p class="hint">Create bills and record payments. Residents see their flat's bills and cannot change them.</p>

    @if (success()) {
      <p class="success">{{ success() }}</p>
    }
    @if (actionError()) {
      <p class="field-error">{{ actionError() }}</p>
    }

    <div class="panels">
      <div class="panel">
        <h3>Generate for all flats</h3>
        <label for="genMonth">Month</label>
        <input id="genMonth" type="month" [(ngModel)]="genMonth" />

        <label for="genAmount">Amount per flat (₹)</label>
        <input id="genAmount" type="number" step="0.01" min="0" [(ngModel)]="genAmount" />

        @if (genError()) {
          <p class="field-error">{{ genError() }}</p>
        }
        <button class="primary" [disabled]="generating()" (click)="generate()">
          {{ generating() ? 'Generating...' : 'Generate bills' }}
        </button>
        <p class="meta">Flats that already have a bill for that month are skipped.</p>
      </div>

      <div class="panel">
        <h3>Create one bill</h3>
        <label for="billFlat">Flat</label>
        <select id="billFlat" [(ngModel)]="billFlatId">
          <option [ngValue]="null">Select a flat</option>
          @for (f of flats(); track f.id) {
            <option [ngValue]="f.id">{{ f.blockName }}-{{ f.flatNumber }}</option>
          }
        </select>

        <label for="billMonth">Month</label>
        <input id="billMonth" type="month" [(ngModel)]="billMonth" />

        <label for="billAmount">Amount (₹)</label>
        <input id="billAmount" type="number" step="0.01" min="0" [(ngModel)]="billAmount" />

        @if (billError()) {
          <p class="field-error">{{ billError() }}</p>
        }
        <button class="primary" [disabled]="creating()" (click)="createOne()">
          {{ creating() ? 'Creating...' : 'Create bill' }}
        </button>
      </div>
    </div>

    <h3>All bills</h3>

    @if (bills().length > 0) {
      <div class="summary">
        <span>Pending across all flats</span>
        <strong>{{ pendingTotal() | currency: 'INR' : 'symbol' : '1.2-2' }}</strong>
      </div>
    }

    <div class="filters">
      @for (f of filters; track f.key) {
        <button type="button" class="chip" [class.on]="filter() === f.key" (click)="filter.set(f.key)">
          {{ f.label }} ({{ count(f.key) }})
        </button>
      }
      <input
        class="search"
        placeholder="Search by flat, e.g. A-101"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
    </div>

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (b of shown(); track b.id) {
        <div class="card">
          <div class="info">
            <strong>{{ b.flatLabel }} &middot; {{ b.billMonth | date: 'MMMM y' }}</strong>
            <span class="amount">{{ b.amount | currency: 'INR' : 'symbol' : '1.2-2' }}</span>
            @if (b.paidOn) {
              <span class="meta">Paid on {{ b.paidOn | date: 'd MMM y' }}</span>
            }
          </div>
          <div class="side">
            <span class="badge" [class]="b.status.toLowerCase()">{{ b.status === 'PAID' ? 'Paid' : 'Pending' }}</span>
            @if (b.status === 'PENDING') {
              <button class="pay" [disabled]="busyId() === b.id" (click)="markPaid(b)">Mark paid</button>
            }
          </div>
        </div>
      } @empty {
        <p>No bills in this view.</p>
      }

      @if (filtered().length > shown().length) {
        <p class="meta">Showing the first {{ shown().length }} of {{ filtered().length }} bills. Use the search box to narrow the list.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .success { color: #1e6b32; font-size: 14px; }
    .field-error { color: #c0392b; font-size: 14px; margin: 0 0 10px; }
    .meta { color: #777777; font-size: 13px; margin: 4px 0; }
    .panels { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .panel {
      display: flex;
      flex-direction: column;
      width: 300px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .panel h3 { margin: 0 0 12px; }
    label { margin-bottom: 4px; font-size: 14px; }
    input, select {
      padding: 9px;
      margin-bottom: 12px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      max-width: 560px;
      margin-bottom: 14px;
      padding: 12px 18px;
      background: #eef2f7;
      border-radius: 8px;
    }
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
    .search { margin: 0; flex: 1; min-width: 180px; max-width: 260px; }
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 560px;
      margin-bottom: 10px;
      padding: 12px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .info { display: flex; flex-direction: column; gap: 2px; }
    .amount { font-size: 18px; font-weight: bold; }
    .side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .pending { background: #fff3cd; color: #8a6d0b; }
    .paid { background: #d4edda; color: #1e6b32; }
    button { border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { padding: 7px 16px; background: #1f3864; }
    .primary { padding: 9px 16px; background: #2e8b57; align-self: flex-start; }
    .pay { padding: 6px 12px; background: #1f3864; }
  `
})
export class AdminBills {
  private maintenanceService = inject(MaintenanceService);
  private flatService = inject(FlatService);

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'PAID', label: 'Paid' }
  ];

  flats = signal<Flat[]>([]);
  bills = signal<Bill[]>([]);
  filter = signal<Filter>('ALL');
  search = signal('');
  loading = signal(true);
  loadError = signal('');
  success = signal('');
  actionError = signal('');
  genError = signal('');
  billError = signal('');
  generating = signal(false);
  creating = signal(false);
  busyId = signal<number | null>(null);

  genMonth = '';
  genAmount: number | null = null;
  billFlatId: number | null = null;
  billMonth = '';
  billAmount: number | null = null;

  filtered = computed(() => {
    const status = this.filter();
    const query = this.search().trim().toLowerCase();
    return this.bills().filter(
      (b) =>
        (status === 'ALL' || b.status === status) &&
        (!query || b.flatLabel.toLowerCase().includes(query))
    );
  });

  shown = computed(() => this.filtered().slice(0, SHOW_LIMIT));

  // Added up in paise to avoid decimal rounding noise. Display only.
  pendingTotal = computed(() => {
    const paise = this.bills()
      .filter((b) => b.status === 'PENDING')
      .reduce((sum, b) => sum + Math.round(b.amount * 100), 0);
    return paise / 100;
  });

  constructor() {
    this.loadBills(true);
    this.flatService.list().subscribe({
      next: (list) => this.flats.set(list),
      error: (err: HttpErrorResponse) => this.loadError.set(errorMessage(err))
    });
  }

  loadBills(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.loadError.set('');
    this.maintenanceService.all().subscribe({
      next: (list) => {
        this.bills.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  count(key: Filter): number {
    const all = this.bills();
    return key === 'ALL' ? all.length : all.filter((b) => b.status === key).length;
  }

  generate() {
    this.genError.set('');
    this.success.set('');
    this.actionError.set('');

    const problem = this.monthError(this.genMonth) || this.amountError(this.genAmount);
    if (problem) {
      this.genError.set(problem);
      return;
    }

    const amount = this.genAmount as number;
    if (
      !confirm(
        `Create a bill of ₹${amount.toFixed(2)} for every flat for ${this.genMonth}? ` +
          'Flats that already have a bill for that month are skipped.'
      )
    ) {
      return;
    }

    this.generating.set(true);
    this.maintenanceService.generate({ billMonth: this.genMonth + '-01', amount }).subscribe({
      next: (result) => {
        this.generating.set(false);
        this.genAmount = null;
        this.success.set(
          `Created ${result.created} bill(s). Skipped ${result.skipped} flat(s) that already had one.`
        );
        this.loadBills(false);
      },
      error: (err: HttpErrorResponse) => {
        this.genError.set(errorMessage(err));
        this.generating.set(false);
      }
    });
  }

  createOne() {
    this.billError.set('');
    this.success.set('');
    this.actionError.set('');

    if (this.billFlatId === null || this.billFlatId === undefined) {
      this.billError.set('Please select a flat');
      return;
    }
    const problem = this.monthError(this.billMonth) || this.amountError(this.billAmount);
    if (problem) {
      this.billError.set(problem);
      return;
    }

    this.creating.set(true);
    this.maintenanceService
      .create({
        flatId: this.billFlatId,
        billMonth: this.billMonth + '-01',
        amount: this.billAmount as number
      })
      .subscribe({
        next: (bill) => {
          this.creating.set(false);
          this.billAmount = null;
          this.success.set(`Bill created for flat ${bill.flatLabel}.`);
          this.loadBills(false);
        },
        error: (err: HttpErrorResponse) => {
          this.billError.set(errorMessage(err));
          this.creating.set(false);
        }
      });
  }

  markPaid(bill: Bill) {
    if (
      !confirm(
        `Mark the ${bill.billMonth.slice(0, 7)} bill for flat ${bill.flatLabel} as paid? Today's date will be recorded.`
      )
    ) {
      return;
    }

    this.busyId.set(bill.id);
    this.success.set('');
    this.actionError.set('');

    this.maintenanceService.markPaid(bill.id).subscribe({
      next: (updated) => {
        this.bills.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
        this.busyId.set(null);
        this.success.set(`Bill for flat ${updated.flatLabel} marked as paid.`);
      },
      error: (err: HttpErrorResponse) => {
        this.actionError.set(errorMessage(err));
        this.busyId.set(null);
        this.loadBills(false);
      }
    });
  }

  private monthError(month: string): string {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? '') ? '' : 'Please choose a month';
  }

  private amountError(amount: number | null): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return 'Amount is required';
    }
    if (amount <= 0) {
      return 'Amount must be greater than zero';
    }
    if (amount > 99999999.99) {
      return 'Amount is too large';
    }
    if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
      return 'Amount can have at most 2 decimals';
    }
    return '';
  }
}