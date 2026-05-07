import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Point to API Gateway
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    this.currentUser = this.currentUserSubject.asObservable();
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profile);
  }

  changePassword(passwords: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile/password`, passwords);
  }

  updateEmail(emailRequest: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile/email`, emailRequest);
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  getToken(): string {
    return this.currentUserValue?.accessToken;
  }
}
