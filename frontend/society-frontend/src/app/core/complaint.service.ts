import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface Complaint {
  id: number;
  title: string;
  description: string | null;
  status: ComplaintStatus;
  adminRemarks: string | null;
  residentId: number;
  residentName: string;
  flatLabel: string;
  assignedToId: number | null;
  assignedToName: string | null;
  createdAt: string | null;
}

export interface NewComplaint {
  title: string;
  description: string;
}

export interface StatusUpdate {
  status: ComplaintStatus;
  adminRemarks: string | null;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);

  // Resident
  myComplaints() {
    return this.http.get<Complaint[]>('/api/complaints/my');
  }

  raise(complaint: NewComplaint) {
    return this.http.post<Complaint>('/api/complaints', complaint);
  }

  // Admin
  all() {
    return this.http.get<Complaint[]>('/api/complaints');
  }

  updateStatus(id: number, update: StatusUpdate) {
    return this.http.put<Complaint>(`/api/complaints/${id}/status`, update);
  }

  assign(id: number, userId: number | null) {
    return this.http.put<Complaint>(`/api/complaints/${id}/assign`, { userId });
  }
}