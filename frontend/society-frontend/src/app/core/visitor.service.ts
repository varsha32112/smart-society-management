import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type VisitorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Visitor {
  id: number;
  visitorName: string;
  visitorPhone: string | null;
  purpose: string | null;
  flatId: number;
  flatLabel: string;
  status: VisitorStatus;
  entryTime: string | null;
  exitTime: string | null;
  createdAt: string | null;
}

export interface NewVisitor {
  visitorName: string;
  visitorPhone: string | null;
  purpose: string | null;
  flatId: number;
}

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private http = inject(HttpClient);

  // Resident
  myVisitors() {
    return this.http.get<Visitor[]>('/api/visitors/my');
  }

  approve(id: number) {
    return this.http.put<Visitor>(`/api/visitors/${id}/approve`, {});
  }

  reject(id: number) {
    return this.http.put<Visitor>(`/api/visitors/${id}/reject`, {});
  }

  // Security
  register(visitor: NewVisitor) {
    return this.http.post<Visitor>('/api/visitors', visitor);
  }

  recent() {
    return this.http.get<Visitor[]>('/api/visitors/recent');
  }

  recordEntry(id: number) {
    return this.http.put<Visitor>(`/api/visitors/${id}/entry`, {});
  }

  recordExit(id: number) {
    return this.http.put<Visitor>(`/api/visitors/${id}/exit`, {});
  }
    // Admin
  all() {
    return this.http.get<Visitor[]>('/api/visitors');
  }
}