import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test: Fetch all notifications for a user
  it('should fetch notifications for a user', () => {
    const mockNotifications = [
      { id: '1', message: 'admin mentioned you in a comment', type: 'MENTION', read: false },
      { id: '2', message: 'Project created successfully', type: 'PROJECT_CREATED', read: true }
    ];

    service.getNotifications('amitrai').subscribe(notifications => {
      expect(notifications.length).toBe(2);
      expect(notifications[0].type).toBe('MENTION');
      expect(notifications[1].read).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/notifications/user/amitrai');
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);
  });

  // Test: Fetch unread notification count
  it('should fetch unread count', () => {
    service.getUnreadCount('amitrai').subscribe(count => {
      expect(count).toBe(3);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/notifications/user/amitrai/unread-count');
    expect(req.request.method).toBe('GET');
    req.flush(3);
  });

  // Test: Mark a notification as read
  it('should mark notification as read via PATCH', () => {
    service.markAsRead('notif-abc').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/notifications/notif-abc/read');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'notif-abc', read: true });
  });

  // Test: WebSocket disconnect
  it('should handle disconnect gracefully when no client exists', () => {
    // When stompClient is null, disconnect should not throw
    expect(() => service.disconnect()).not.toThrow();
  });

  // Test: WebSocket disconnect when client exists
  it('should call deactivate on disconnect', () => {
    (service as any).stompClient = {
      deactivate: jasmine.createSpy('deactivate')
    };

    service.disconnect();

    expect((service as any).stompClient.deactivate).toHaveBeenCalled();
  });

  // Test: getNewNotifications should return an Observable
  it('should return an Observable from getNewNotifications', () => {
    const obs = service.getNewNotifications();
    expect(obs).toBeTruthy();
    expect(typeof obs.subscribe).toBe('function');
  });
});
