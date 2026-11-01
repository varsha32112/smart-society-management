import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ResidentSearchResult {
  id: number;
  fullName: string;
  flatId: number;
  flatLabel: string;
}

@Injectable({ providedIn: 'root' })
export class ResidentService {
  private http = inject(HttpClient);

  search(name: string) {
    return this.http.get<ResidentSearchResult[]>('/api/residents/search', { params: { name } });
  }
}