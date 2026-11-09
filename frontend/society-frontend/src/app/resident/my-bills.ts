import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { toDataURL } from 'qrcode';
import { Bill, MaintenanceService } from '../core/maintenance.service';
import { PaymentService } from '../core/payment.service';
import { UpiClaim, UpiConfig, UpiService } from '../core/upi.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-my-bills',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="header">
      <h2>My Bills</h2>
      <button class="refresh" (click)="reload()">Refresh</button>
    </div>
    <p class="hint">
      @if (razorpayEnabled() || upi()?.enabled) {
        Maintenance bills for your flat. Pay online, or pay the society office, which records the payment.
      } @else {
        Maintenance bills for your flat. Payments are recorded by the society office.
      }
    </p>

    @if (success()) {
      <p class="success">{{ success() }}</p>
    }
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

          @if (b.status === 'PENDING') {
            @let claim = claimFor(b);
            @if (claim && claim.status === 'CLAIMED') {
              <p class="waiting">
                Payment claimed (reference {{ claim.utr }}). Waiting for the society office to confirm.
              </p>
            } @else {
              @if (claim && claim.status === 'REJECTED') {
                <p class="rejected">Your last claim (reference {{ claim.utr }}) was not accepted: {{ claim.note }}</p>
              }

              <div class="actions">
                @if (razorpayEnabled()) {
                  <button class="pay" [disabled]="payingId() !== null" (click)="pay(b)">
                    {{ payingId() === b.id ? 'Opening payment...' : 'Pay now (card or netbanking)' }}
                  </button>
                }
                @if (upi()?.enabled) {
                  <button class="upi" (click)="openUpi(b)">Pay by UPI</button>
                }
              </div>

              @if (upiOpenId() === b.id) {
                <div class="panel">
                  <p><strong>Pay {{ b.amount | currency: 'INR' : 'symbol' : '1.2-2' }} to {{ upi()?.payeeName }}</strong></p>
                  <p>UPI ID: <strong>{{ upi()?.upiId }}</strong></p>
                  <p class="meta">
                    On a phone, tap <a class="open-app" [href]="upiHref()">Open my UPI app</a>.
                    On a computer, scan this code with any UPI app.
                  </p>
                  @if (qrUrl()) {
                    <img class="qr" [src]="qrUrl()" alt="UPI QR code" width="200" height="200" />
                  }
                  <p class="meta">After paying, enter the 12-digit UPI reference number (UTR) shown in your app.</p>
                  <input
                    class="utr"
                    [(ngModel)]="utr"
                    maxlength="12"
                    inputmode="numeric"
                    placeholder="12-digit reference number"
                  />
                  @if (utrError()) {
                    <p class="error">{{ utrError() }}</p>
                  }
                  <div class="actions">
                    <button class="pay" [disabled]="submittingUtr()" (click)="submitUtr(b)">
                      {{ submittingUtr() ? 'Sending...' : 'I have paid' }}
                    </button>
                    <button class="cancel" (click)="closeUpi()">Cancel</button>
                  </div>
                </div>
              }
            }
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
    .error { color: #c0392b; font-size: 14px; }
    .success { color: #1e6b32; }
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
    .waiting { padding: 8px 10px; background: #fff3cd; color: #8a6d0b; border-radius: 6px; font-size: 14px; }
    .rejected { padding: 8px 10px; background: #f8d7da; color: #9b2c2c; border-radius: 6px; font-size: 14px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .pending { background: #fff3cd; color: #8a6d0b; }
    .paid { background: #d4edda; color: #1e6b32; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .panel {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 10px;
      padding: 12px;
      background: #f6f8fb;
      border-radius: 6px;
    }
    .qr { align-self: flex-start; margin: 6px 0; }
    .open-app { color: #1f3864; font-weight: bold; }
    .utr {
      max-width: 260px;
      padding: 9px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
    button { padding: 7px 16px; border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { background: #1f3864; }
    .pay { background: #2e8b57; }
    .upi { background: #5b3cc4; }
    .cancel { background: #7a869a; }
  `
})
export class MyBills {
  private maintenanceService = inject(MaintenanceService);
  private paymentService = inject(PaymentService);
  private upiService = inject(UpiService);
  private sanitizer = inject(DomSanitizer);

  bills = signal<Bill[]>([]);
  claims = signal<UpiClaim[]>([]);
  loading = signal(true);
  error = signal('');
  success = signal('');
  razorpayEnabled = signal(false);
  upi = signal<UpiConfig | null>(null);
  payingId = signal<number | null>(null);

  upiOpenId = signal<number | null>(null);
  qrUrl = signal('');
  upiHref = signal<SafeUrl | null>(null);
  utrError = signal('');
  submittingUtr = signal(false);
  utr = '';

  // Total of unpaid bills, added up in paise to avoid decimal rounding noise. Display only.
  outstanding = computed(() => {
    const paise = this.bills()
      .filter((b) => b.status === 'PENDING')
      .reduce((sum, b) => sum + Math.round(b.amount * 100), 0);
    return paise / 100;
  });

  constructor() {
    this.load(true);
    this.loadClaims();

    this.paymentService.config().subscribe({
      next: (config) => this.razorpayEnabled.set(config.enabled),
      error: () => this.razorpayEnabled.set(false)
    });
    this.upiService.config().subscribe({
      next: (config) => this.upi.set(config),
      error: () => this.upi.set(null)
    });

    // If a card payment was made but the window was closed before we heard back, catch up now.
    this.paymentService.reconcile().subscribe({
      next: (result) => {
        if (result.updated > 0) {
          this.success.set('A payment you made earlier has now been confirmed.');
          this.load(false);
        }
      },
      error: () => {
        /* not critical */
      }
    });
  }

  reload() {
    this.load(true);
    this.loadClaims();
  }

  load(showSpinner: boolean) {
    if (showSpinner) {
      this.loading.set(true);
    }
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

  loadClaims() {
    this.upiService.myClaims().subscribe({
      next: (list) => this.claims.set(list),
      error: () => this.claims.set([])
    });
  }

  // The newest claim for a bill (claims arrive newest first).
  claimFor(bill: Bill): UpiClaim | undefined {
    return this.claims().find((c) => c.billId === bill.id);
  }

  // ----- card and netbanking (Razorpay) -----

  async pay(bill: Bill) {
    this.error.set('');
    this.success.set('');
    this.payingId.set(bill.id);

    try {
      const order = await firstValueFrom(this.paymentService.createOrder(bill.id));
      const result = await this.paymentService.openCheckout(order);
      await firstValueFrom(this.paymentService.verify(result));
      this.success.set('Payment received. Thank you!');
      this.load(false);
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        this.error.set(errorMessage(e));
      } else if (e instanceof Error) {
        this.error.set(e.message);
      } else {
        this.error.set('The payment was not completed.');
      }
      this.load(false);
    } finally {
      this.payingId.set(null);
    }
  }

  // ----- UPI to the society's own UPI ID -----

  async openUpi(bill: Bill) {
    const config = this.upi();
    if (!config?.upiId) {
      return;
    }
    this.utr = '';
    this.utrError.set('');
    this.success.set('');
    this.error.set('');

    const note = `Maintenance ${bill.billMonth.slice(0, 7)} ${bill.flatLabel}`;
    const link =
      `upi://pay?pa=${encodeURIComponent(config.upiId)}` +
      `&pn=${encodeURIComponent(config.payeeName ?? 'Society')}` +
      `&am=${bill.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

    // The link is built here from our own settings, so it is safe to allow the upi: scheme.
    this.upiHref.set(this.sanitizer.bypassSecurityTrustUrl(link));
    this.qrUrl.set('');
    this.upiOpenId.set(bill.id);

    try {
      this.qrUrl.set(await toDataURL(link, { width: 220, margin: 1 }));
    } catch {
      /* the link still works without the QR code */
    }
  }

  closeUpi() {
    this.upiOpenId.set(null);
    this.utrError.set('');
  }

  submitUtr(bill: Bill) {
    this.utrError.set('');
    this.success.set('');

    const utr = (this.utr ?? '').trim();
    if (!/^[0-9]{12}$/.test(utr)) {
      this.utrError.set('The UTR must be exactly 12 digits');
      return;
    }

    this.submittingUtr.set(true);
    this.upiService.submit(bill.id, utr).subscribe({
      next: () => {
        this.submittingUtr.set(false);
        this.closeUpi();
        this.success.set('Thank you. The society office will confirm your payment shortly.');
        this.loadClaims();
      },
      error: (err: HttpErrorResponse) => {
        this.utrError.set(errorMessage(err));
        this.submittingUtr.set(false);
      }
    });
  }
}