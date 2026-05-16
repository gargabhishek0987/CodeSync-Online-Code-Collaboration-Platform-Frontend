import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExecutionService {
  private apiUrl = 'http://localhost:8080/api/execute';

  constructor(private http: HttpClient) {}

  executeCode(language: string, code: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { language, code });
  }

  getJobStatus(jobId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${jobId}`);
  }

  getAllJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/all`);
  }

  cancelJob(jobId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${jobId}/cancel`, {});
  }
}
