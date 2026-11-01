import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ResidentSearchResult, ResidentService } from '../core/resident.service';
import { VisitorService } from '../core/visitor.service';
import { errorMessage } from '../core/error-message';

const PHONE_PATTERN = /^[0-9+\- ]{7,15}$/;

@Component({
  selector: 'app-register-visitor',
  imports: [FormsModule],
  template: `
    <h2>Register a visitor</h2>
    <p class="hint">Step 1: find the resident being visited. Step 2: enter the visitor's details.</p>

    @if (success()) {
      <p class="success">{{ success() }}</p>
    }

    @if (selected(); as resident) {
      <div class="chosen">
        <span>Visiting: <strong>{{ resident.fullName }}</strong> (Flat {{ resident.flatLabel }})</span>
        <button class="link" type="button" (click)="clearSelection()">Change</button>
      </div>

      <form #f="ngForm" class="form" (ngSubmit)="submit(f)" novalidate>
        <label for="visitorName">Visitor name</label>
        <input id="visitorName" name="visitorName" [(ngModel)]="visitorName" required maxlength="100" #nameCtl="ngModel" />
        @if (nameCtl.invalid && (nameCtl.touched || f.submitted)) {
          <p class="field-error">Visitor name is required</p>
        }

        <label for="visitorPhone">Visitor phone (optional)</label>
        <input id="visitorPhone" name="visitorPhone" [(ngModel)]="visitorPhone" maxlength="15" />
        @if (phoneError()) {
          <p class="field-error">{{ phoneError() }}</p>
        }

        <label for="purpose">Purpose (optional)</label>
        <input id="purpose" name="purpose" [(ngModel)]="purpose" maxlength="200" placeholder="e.g. Delivery, Guest, Repair" />

        @if (formError()) {
          <p class="field-error">{{ formError() }}</p>
        }

        <button class="submit" type="submit" [disabled]="sending()">
          {{ sending() ? 'Registering...' : 'Register and notify resident' }}
        </button>
      </form>
    } @else {
      <label for="search">Search resident by name</label>
      <input
        id="search"
        class="search"
        [ngModel]="searchText()"
        (ngModelChange)="onSearchInput($event)"
        placeholder="Type at least 2 letters"
        autocomplete="off"
      />

      @if (searchError()) {
        <p class="field-error">{{ searchError() }}</p>
      }
      @if (searching()) {
        <p class="meta">Searching...</p>
      }

      @for (r of results(); track r.id) {
        <button class="result" type="button" (click)="choose(r)">
          <strong>{{ r.fullName }}</strong>
          <span>Flat {{ r.flatLabel }}</span>
        </button>
      }

      @if (!searching() && !searchError() && searchText().trim().length >= 2 && results().length === 0) {
        <p class="meta">No residents found.</p>
      }
    }
  `,
  styles: `
    .hint { color: #666666; margin-top: 0; }
    .meta { color: #777777; font-size: 14px; }
    .success { max-width: 520px; padding: 10px 14px; background: #d4edda; color: #1e6b32; border-radius: 6px; }
    .field-error { margin: 0 0 10px; color: #c0392b; font-size: 14px; }
    label { display: block; margin-bottom: 4px; font-size: 14px; }
    input {
      padding: 9px;
      margin-bottom: 12px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-size: 14px;
    }
    .search { width: 100%; max-width: 520px; box-sizing: border-box; }
    .result {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 520px;
      margin-bottom: 8px;
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
    }
    .result:hover { background: #eef2f7; }
    .chosen {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 520px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: #eef2f7;
      border-radius: 8px;
    }
    .form { display: flex; flex-direction: column; max-width: 520px; }
    button { border: none; border-radius: 6px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .submit { padding: 9px 16px; background: #2e8b57; color: #ffffff; align-self: flex-start; }
    .link { background: transparent; color: #1f3864; text-decoration: underline; }
  `
})
export class RegisterVisitor {
  private residentService = inject(ResidentService);
  private visitorService = inject(VisitorService);
  private searchTerms = new Subject<string>();

  searchText = signal('');
  results = signal<ResidentSearchResult[]>([]);
  searching = signal(false);
  searchError = signal('');
  selected = signal<ResidentSearchResult | null>(null);

  visitorName = '';
  visitorPhone = '';
  purpose = '';
  sending = signal(false);
  formError = signal('');
  phoneError = signal('');
  success = signal('');

  constructor() {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 2) {
            return of<ResidentSearchResult[]>([]);
          }
          this.searching.set(true);
          return this.residentService.search(term).pipe(
            catchError((err: HttpErrorResponse) => {
              this.searchError.set(errorMessage(err));
              return of<ResidentSearchResult[]>([]);
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((list) => {
        this.results.set(list);
        this.searching.set(false);
      });
  }

  onSearchInput(text: string) {
    this.searchText.set(text);
    this.searchError.set('');
    this.searchTerms.next(text.trim());
  }

  choose(resident: ResidentSearchResult) {
    this.selected.set(resident);
    this.results.set([]);
    this.searchText.set('');
    this.success.set('');
  }

  clearSelection() {
    this.selected.set(null);
    this.formError.set('');
    this.phoneError.set('');
  }

  submit(form: NgForm) {
    this.formError.set('');
    this.phoneError.set('');
    this.success.set('');

    const resident = this.selected();
    const visitorName = (this.visitorName ?? '').trim();
    const visitorPhone = (this.visitorPhone ?? '').trim();
    const purpose = (this.purpose ?? '').trim();

    let valid = true;
    if (!resident) {
      this.formError.set('Please select the resident first');
      valid = false;
    }
    if (form.invalid || !visitorName) {
      this.formError.set('Please enter the visitor name');
      valid = false;
    }
    if (visitorPhone && !PHONE_PATTERN.test(visitorPhone)) {
      this.phoneError.set('Phone must be 7 to 15 characters: digits, + - or spaces');
      valid = false;
    }
    if (!valid || !resident) {
      return;
    }

    this.sending.set(true);
    this.visitorService
      .register({
        visitorName,
        visitorPhone: visitorPhone || null,
        purpose: purpose || null,
        flatId: resident.flatId
      })
      .subscribe({
        next: (visitor) => {
          this.sending.set(false);
          form.resetForm({ visitorName: '', visitorPhone: '', purpose: '' });
          this.selected.set(null);
          this.success.set(
            `${visitor.visitorName} registered for flat ${visitor.flatLabel}. Waiting for the resident's approval.`
          );
        },
        error: (err: HttpErrorResponse) => {
          this.formError.set(errorMessage(err));
          this.sending.set(false);
        }
      });
  }
}