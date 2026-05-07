import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8080/api/projects';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user`);
  }

  getPublicProjects(query: string = '', language: string = ''): Observable<any[]> {
    let params = '?';
    if (query) params += `query=${query}&`;
    if (language) params += `language=${language}`;
    return this.http.get<any[]>(`${this.apiUrl}/public${params}`);
  }

  getProject(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createProject(project: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateSynopsis(projectId: number, synopsis: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${projectId}/synopsis`, synopsis);
  }
}
