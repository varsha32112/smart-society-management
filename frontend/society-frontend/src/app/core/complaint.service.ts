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
  createdAt: string | null;
}

export interface NewComplaint {
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);

  myComplaints() {
    return this.http.get<Complaint[]>('/api/complaints/my');
  }

  raise(complaint: NewComplaint) {
    return this.http.post<Complaint>('/api/complaints', complaint);
  }
}