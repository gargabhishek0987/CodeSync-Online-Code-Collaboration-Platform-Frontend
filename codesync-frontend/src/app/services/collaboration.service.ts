import { Injectable, NgZone } from '@angular/core';
import { Client, Message, IMessage } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private stompClient: Client | null = null;
  private codeChangesSubject = new Subject<any>();
  private cursorsSubject = new Subject<any>();
  private presenceSubject = new Subject<any>();

  constructor(private ngZone: NgZone) {}

  connect(projectId: number, token: string) {
    const socket = new SockJS(`http://localhost:8080/ws-collab/ws`);
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (msg) => console.log('STOMP:', msg),
      onConnect: (frame) => {
        console.log('Connected to WebSocket');
        
        // Join project
        this.stompClient?.publish({
          destination: `/app/project/${projectId}/join`
        });

        // Subscribe to code changes
        this.stompClient?.subscribe(`/topic/project/${projectId}/edit`, (message: IMessage) => {
          this.ngZone.run(() => {
            this.codeChangesSubject.next(JSON.parse(message.body));
          });
        });

        // Subscribe to cursor moves
        this.stompClient?.subscribe(`/topic/project/${projectId}/cursor`, (message: IMessage) => {
          this.ngZone.run(() => {
            this.cursorsSubject.next(JSON.parse(message.body));
          });
        });

        // Subscribe to presence
        this.stompClient?.subscribe(`/topic/project/${projectId}/presence`, (message: IMessage) => {
          this.ngZone.run(() => {
            this.presenceSubject.next(JSON.parse(message.body));
          });
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  sendCodeChange(projectId: number, change: any) {
    this.stompClient?.publish({
      destination: `/app/project/${projectId}/edit`,
      body: JSON.stringify(change)
    });
  }

  sendCursorMove(projectId: number, cursor: any) {
    this.stompClient?.publish({
      destination: `/app/project/${projectId}/cursor`,
      body: JSON.stringify(cursor)
    });
  }

  getCodeChanges(): Observable<any> {
    return this.codeChangesSubject.asObservable();
  }

  getCursors(): Observable<any> {
    return this.cursorsSubject.asObservable();
  }

  getPresence(): Observable<any> {
    return this.presenceSubject.asObservable();
  }
}
