import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  template: `
    <header class="bar">
      <strong>Smart Society</strong>
      <span class="spacer"></span>
      @if (auth.currentUser(); as user) {
        <span class="who">{{ user.fullName }} ({{ user.role }})</span>
      }
      <button (click)="auth.logout()">Log out</button>
    </header>
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      background: #1f3864;
      color: #ffffff;
      font-family: Arial, sans-serif;
    }
    .spacer { flex: 1; }
    .who { font-size: 14px; }
    button {
      padding: 6px 14px;
      border: 1px solid #ffffff;
      border-radius: 6px;
      background: transparent;
      color: #ffffff;
      cursor: pointer;
    }
    .content {
      padding: 24px;
      font-family: Arial, sans-serif;
    }
  `
})
export class Shell {
  auth = inject(AuthService);
}