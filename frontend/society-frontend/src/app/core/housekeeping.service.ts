import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ComplaintStatus } from './complaint.service';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: ComplaintStatus;
  remarks: string | null;
  flatLabel: string;
  createdAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class HousekeepingService {
  private http = inject(HttpClient);

  tasks() {
    return this.http.get<Task[]>('/api/housekeeping/tasks');
  }

  update(id: number, status: ComplaintStatus, remarks: string | null) {
    return this.http.put<Task>(`/api/housekeeping/tasks/${id}/status`, { status, adminRemarks: remarks });
  }
}