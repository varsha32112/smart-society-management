import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Person } from './people.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  get() {
    return this.http.get<Person>('/api/me');
  }

  update(details: { fullName: string; phone: string | null }) {
    return this.http.put<Person>('/api/me', details);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<void>('/api/me/password', { currentPassword, newPassword });
  }
}
