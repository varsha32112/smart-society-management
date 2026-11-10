import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-housekeeping-home',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs">
      <a routerLink="tasks" routerLinkActive="active">My tasks</a>
      <a routerLink="notices" routerLinkActive="active">Notices</a>
    </nav>
    <router-outlet />
  `,
  styles: `
    .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #d5dce6; }
    a {
      padding: 8px 16px;
      color: #1f3864;
      text-decoration: none;
      border-bottom: 3px solid transparent;
    }
    a.active { border-bottom-color: #1f3864; font-weight: bold; }
  `
})
export class HousekeepingHome {}