import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Flat {
  id: number;
  blockName: string;
  flatNumber: string;
  floorNo: number | null;
}

export interface FlatInput {
  blockName: string;
  flatNumber: string;
  floorNo: number | null;
}

@Injectable({ providedIn: 'root' })
export class FlatService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Flat[]>('/api/flats');
  }

  add(flat: FlatInput) {
    return this.http.post<Flat>('/api/flats', flat);
  }

  update(id: number, flat: FlatInput) {
    return this.http.put<Flat>(`/api/flats/${id}`, flat);
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/flats/${id}`);
  }
}