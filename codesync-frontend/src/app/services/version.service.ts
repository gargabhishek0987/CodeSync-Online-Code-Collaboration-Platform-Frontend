import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private apiUrl = 'http://localhost:8080/api/versions';

  constructor(private http: HttpClient) {}

  createSnapshot(fileId: number, content: string, message: string, branch: string = 'main'): Observable<any> {
    return this.http.post(`${this.apiUrl}/snapshot`, {
      fileId,
      content,
      commitMessage: message,
      branch
    });
  }

  getHistory(fileId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/file/${fileId}/history`);
  }

  getSnapshot(snapshotId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${snapshotId}`);
  }

  getDiff(v1: string, v2: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/diff`, { params: { v1, v2 } });
  }
}
