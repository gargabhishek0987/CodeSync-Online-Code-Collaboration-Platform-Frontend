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

  it('should fetch notifications for a user', () => {
    const mockNotifications = [{ id: '1', message: 'Test' }];
    const userId = 'user123';

    service.getNotifications(userId).subscribe(notifications => {
      expect(notifications.length).toBe(1);
      expect(notifications).toEqual(mockNotifications);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/notifications/user/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);
  });

  it('should fetch unread count', () => {
    const mockCount = 5;
    const userId = 'user123';

    service.getUnreadCount(userId).subscribe(count => {
      expect(count).toBe(mockCount);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/notifications/user/${userId}/unread-count`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCount);
  });

  it('should mark notification as read', () => {
    const notificationId = '1';

    service.markAsRead(notificationId).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/notifications/${notificationId}/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should handle disconnect', () => {
    // Mock stompClient
    (service as any).stompClient = {
      deactivate: jasmine.createSpy('deactivate')
    };

    service.disconnect();

    expect((service as any).stompClient.deactivate).toHaveBeenCalled();
  });
});
