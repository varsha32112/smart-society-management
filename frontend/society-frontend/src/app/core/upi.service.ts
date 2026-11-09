import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface UpiConfig {
  enabled: boolean;
  upiId: string | null;
  payeeName: string | null;
}

export type ClaimStatus = 'CLAIMED' | 'CONFIRMED' | 'REJECTED';

export interface UpiClaim {
  id: number;
  billId: number;
  flatLabel: string;
  billMonth: string;
  amount: number;
  residentName: string;
  utr: string;
  status: ClaimStatus;
  note: string | null;
  createdAt: string | null;
  decidedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class UpiService {
  private http = inject(HttpClient);

  // Resident
  config() {
    return this.http.get<UpiConfig>('/api/upi/config');
  }

  submit(billId: number, utr: string) {
    return this.http.post<UpiClaim>('/api/upi/claims', { billId, utr });
  }

  myClaims() {
    return this.http.get<UpiClaim[]>('/api/upi/claims/my');
  }

  // Admin
  adminList(status?: ClaimStatus) {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    return this.http.get<UpiClaim[]>('/api/admin/upi-claims', { params });
  }

  confirm(id: number) {
    return this.http.put<UpiClaim>(`/api/admin/upi-claims/${id}/confirm`, {});
  }

  reject(id: number, note: string) {
    return this.http.put<UpiClaim>(`/api/admin/upi-claims/${id}/reject`, { note });
  }
}