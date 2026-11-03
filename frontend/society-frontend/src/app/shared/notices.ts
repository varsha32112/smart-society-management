import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Notice, NoticeService } from '../core/notice.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-notices',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="header">
      <h2>Notice board</h2>
      <button class="refresh" type="button" (click)="load()">Refresh</button>
    </div>

    @if (isAdmin()) {
      <form #f="ngForm" class="form" (ngSubmit)="publish(f)" novalidate>
        <h3>Publish a notice</h3>

        <label for="title">Title</label>
        <input id="title" name="title" [(ngModel)]="title" required maxlength="150" #titleCtl="ngModel" />
        @if (titleCtl.invalid && (titleCtl.touched || f.submitted)) {
          <p class="field-error">Title is required</p>
        }

        <label for="content">Message</label>
        <textarea id="content" name="content" rows="5" maxlength="5000" [(ngModel)]="content" required #contentCtl="ngModel"></textarea>
        @if (contentCtl.invalid && (contentCtl.touched || f.submitted)) {
          <p class="field-error">Message is required</p>
        }
        <p class="meta">{{ content.length }} / 5000 characters</p>

        @if (formError()) {
          <p class="field-error">{{ formError() }}</p>
        }
        @if (success()) {
          <p class="success">{{ success() }}</p>
        }

        <button class="publish" type="submit" [disabled]="sending()">
          {{ sending() ? 'Publishing...' : 'Publish notice' }}
        </button>
      </form>
    } @else {
      <p class="hint">Announcements from the society office.</p>
    }

    @if (loadError()) {
      <p class="field-error">{{ loadError() }}</p>
    }
    @if (deleteMessage()) {
      <p class="success">{{ deleteMessage() }}</p>
    }

    @if (loading()) {
      <p>Loading...</p>
    } @else {
      @for (n of notices(); track n.id) {
        <div class="card">
          <div class="top">
            <strong>{{ n.title }}</strong>
            @if (isAdmin()) {
              <button class="delete" [disabled]="busyId() === n.id" (click)="remove(n)">Delete</button>
            }
          </div>
          <p class="body">{{ n.content }}</p>
          <p class="meta">Posted by {{ n.postedBy }} on {{ n.createdAt | date: 'd MMM y, h:mm a' }}</p>
        </div>
      } @empty {
        <p>No notices have been published yet.</p>
      }
    }
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; }
    .hint { color: #666666; margin-top: 0; }
    .form {
      display: flex;
      flex-direction: column;
      max-width: 560px;
      margin-bottom: 24px;
      padding: 16px 20px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .form h3 { margin: 0 0 12px; }
    label { margin-bottom: 4px; font-size: 14px; }
    input, textarea {
      padding: 9px;
      margin-bottom: 8px;
      border: 1px solid #c4cdd8;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }
    .field-error { margin: 0 0 10px; color: #c0392b; font-size: 14px; }
    .success { margin: 0 0 10px; color: #1e6b32; font-size: 14px; }
    .meta { color: #777777; font-size: 13px; margin: 4px 0; }
    .card {
      max-width: 560px;
      margin-bottom: 14px;
      padding: 14px 18px;
      background: #ffffff;
      border: 1px solid #d5dce6;
      border-radius: 8px;
    }
    .top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .body { white-space: pre-wrap; margin: 8px 0; }
    button { border: none; border-radius: 6px; color: #ffffff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh { padding: 7px 16px; background: #1f3864; }
    .publish { padding: 9px 16px; background: #2e8b57; align-self: flex-start; }
    .delete { padding: 6px 12px; background: #c0392b; }
  `
})
export class Notices {
  private noticeService = inject(NoticeService);
  private auth = inject(AuthService);

  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  notices = signal<Notice[]>([]);
  loading = signal(true);
  loadError = signal('');
  formError = signal('');
  success = signal('');
  deleteMessage = signal('');
  sending = signal(false);
  busyId = signal<number | null>(null);

  title = '';
  content = '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.loadError.set('');
    this.noticeService.list().subscribe({
      next: (list) => {
        this.notices.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  publish(form: NgForm) {
    this.formError.set('');
    this.success.set('');
    this.deleteMessage.set('');

    const title = (this.title ?? '').trim();
    const content = (this.content ?? '').trim();

    if (!title || !content) {
      this.formError.set('Please enter both a title and a message');
      return;
    }

    this.sending.set(true);
    this.noticeService.publish({ title, content }).subscribe({
      next: (created) => {
        this.notices.update((list) => [created, ...list]);
        form.resetForm({ title: '', content: '' });
        this.sending.set(false);
        this.success.set('Notice published.');
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(errorMessage(err));
        this.sending.set(false);
      }
    });
  }

  remove(notice: Notice) {
    if (!confirm(`Delete the notice "${notice.title}"? This cannot be undone.`)) {
      return;
    }

    this.busyId.set(notice.id);
    this.formError.set('');
    this.success.set('');
    this.deleteMessage.set('');

    this.noticeService.remove(notice.id).subscribe({
      next: () => {
        this.notices.update((list) => list.filter((n) => n.id !== notice.id));
        this.busyId.set(null);
        this.deleteMessage.set('Notice deleted.');
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(errorMessage(err));
        this.busyId.set(null);
        this.load();
      }
    });
  }
}