import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type BillStatus = 'PENDING' | 'PAID';

export interface Bill {
  id: number;
  flatId: number;
  flatLabel: string;
  billMonth: string;
  amount: number;
  status: BillStatus;
  paidOn: string | null;
}

export interface NewBill {
  flatId: number;
  billMonth: string;
  amount: number;
}

export interface BulkBill {
  billMonth: string;
  amount: number;
}

export interface GenerateResult {
  created: number;
  skipped: number;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private http = inject(HttpClient);

  // Resident
  myBills() {
    return this.http.get<Bill[]>('/api/maintenance/my');
  }

  // Admin
  all() {
    return this.http.get<Bill[]>('/api/maintenance');
  }

  create(bill: NewBill) {
    return this.http.post<Bill>('/api/maintenance', bill);
  }

  generate(bulk: BulkBill) {
    return this.http.post<GenerateResult>('/api/maintenance/generate', bulk);
  }

  markPaid(id: number) {
    return this.http.put<Bill>(`/api/maintenance/${id}/pay`, {});
  }
}