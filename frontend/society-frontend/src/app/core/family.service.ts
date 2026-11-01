import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface FamilyMember {
  id: number;
  fullName: string;
  relation: string | null;
  phone: string | null;
}

export interface FamilyMemberInput {
  fullName: string;
  relation: string | null;
  phone: string | null;
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<FamilyMember[]>('/api/family');
  }

  add(member: FamilyMemberInput) {
    return this.http.post<FamilyMember>('/api/family', member);
  }

  update(id: number, member: FamilyMemberInput) {
    return this.http.put<FamilyMember>(`/api/family/${id}`, member);
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/family/${id}`);
  }
}