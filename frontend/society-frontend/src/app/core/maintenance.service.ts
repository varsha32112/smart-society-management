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

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private http = inject(HttpClient);

  myBills() {
    return this.http.get<Bill[]>('/api/maintenance/my');
  }
}