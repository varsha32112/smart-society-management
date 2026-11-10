import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type PersonRole = 'ADMIN' | 'RESIDENT' | 'SECURITY' | 'HOUSEKEEPING';

export interface Person {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: PersonRole;
  flatId: number | null;
  flatLabel: string | null;
  active: boolean;
  createdAt: string | null;
}

export interface NewPerson {
  fullName: string;
  email: string;
  phone: string | null;
  password: string;
  role: 'RESIDENT' | 'SECURITY' | 'HOUSEKEEPING';
  flatId: number | null;
}

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Person[]>('/api/admin/people');
  }

  create(person: NewPerson) {
    return this.http.post<Person>('/api/admin/people', person);
  }

  setActive(id: number, active: boolean) {
    return this.http.put<Person>(`/api/admin/people/${id}/active`, { active });
  }

  resetPassword(id: number, newPassword: string) {
    return this.http.put<void>(`/api/admin/people/${id}/password`, { newPassword });
  }
}