import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:8080/api/comments';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getFileComments(fileId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/file/${fileId}`, { headers: this.getHeaders() });
  }

  addComment(comment: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, comment, { headers: this.getHeaders() });
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${commentId}`, { headers: this.getHeaders() });
  }

  resolveComment(commentId: string, resolved: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${commentId}/resolve?resolved=${resolved}`, {}, { headers: this.getHeaders() });
  }
}
