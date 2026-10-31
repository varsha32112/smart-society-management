import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Flat {
  id: number;
  blockName: string;
  flatNumber: string;
  floorNo: number | null;
}

@Component({
  selector: 'app-admin-home',
  template: `
    <h2>Admin area</h2>
    <h3>Flats</h3>

    @if (error()) {
      <p style="color: #c0392b">{{ error() }}</p>
    }

    <ul>
      @for (flat of flats(); track flat.id) {
        <li>{{ flat.blockName }}-{{ flat.flatNumber }} (floor {{ flat.floorNo }})</li>
      } @empty {
        <li>No flats found.</li>
      }
    </ul>
  `
})
export class AdminHome {
  private http = inject(HttpClient);
  flats = signal<Flat[]>([]);
  error = signal('');

  constructor() {
    this.http.get<Flat[]>('/api/flats').subscribe({
      next: (list) => this.flats.set(list),
      error: () => this.error.set('Could not load flats')
    });
  }
}