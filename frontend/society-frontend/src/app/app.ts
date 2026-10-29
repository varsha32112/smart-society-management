import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private http = inject(HttpClient);
  message = signal('Not connected yet');

  checkBackend() {
    this.http.get('/api/hello', { responseType: 'text' }).subscribe({
      next: (text) => this.message.set(text),
      error: () => this.message.set('Could not reach the backend')
    });
  }
}