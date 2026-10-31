import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-resident-home',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs">
      <a routerLink="visitors" routerLinkActive="active">Visitors</a>
    </nav>
    <router-outlet />
  `,
  styles: `
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #d5dce6; }
    a {
      padding: 8px 16px;
      color: #1f3864;
      text-decoration: none;
      border-bottom: 3px solid transparent;
    }
    a.active { border-bottom-color: #1f3864; font-weight: bold; }
  `
})
export class ResidentHome {}