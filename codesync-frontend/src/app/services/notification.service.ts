import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';
  private stompClient: Client | null = null;
  private notificationSubject = new Subject<any>();

  constructor(private http: HttpClient) {}

  connect(userId: string) {
    const socket = new SockJS('http://localhost:8088/ws-notifications');
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (msg) => console.log('STOMP Notification:', msg),
      onConnect: () => {
        console.log('Connected to Notification WebSocket');
        this.stompClient?.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
          this.notificationSubject.next(JSON.parse(message.body));
        });
      }
    });
    this.stompClient.activate();
  }

  getNotifications(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  getUnreadCount(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/unread-count`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {});
  }

  getNewNotifications(): Observable<any> {
    return this.notificationSubject.asObservable();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
