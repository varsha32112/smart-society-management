import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ReportSummary {
  visitors: { total: number; pending: number; insideNow: number; enteredToday: number };
  complaints: { open: number; inProgress: number; resolved: number };
  billing: { pendingBills: number; pendingAmount: number; paidBills: number; paidAmount: number };
  society: { flats: number; residents: number; securityStaff: number };
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  summary() {
    return this.http.get<ReportSummary>('/api/admin/reports/summary');
  }
}