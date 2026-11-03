import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Notice {
  id: number;
  title: string;
  content: string;
  postedBy: string;
  createdAt: string | null;
}

export interface NewNotice {
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Notice[]>('/api/notices');
  }

  publish(notice: NewNotice) {
    return this.http.post<Notice>('/api/notices', notice);
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/notices/${id}`);
  }
}