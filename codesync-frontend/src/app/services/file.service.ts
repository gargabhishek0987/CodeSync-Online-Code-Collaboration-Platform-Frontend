import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) {}

  getProjectFiles(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getFile(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createFile(file: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, file);
  }

  updateFileContent(id: number, content: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/content`, { content });
  }

  deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  renameFile(id: number, newName: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/rename?newName=${newName}`, {});
  }
}
