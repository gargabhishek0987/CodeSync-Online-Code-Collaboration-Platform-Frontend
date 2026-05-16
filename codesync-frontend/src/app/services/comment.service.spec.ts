import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommentService } from './comment.service';
import { AuthService } from './auth.service';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Create a spy for AuthService to mock getToken()
    const spy = jasmine.createSpyObj('AuthService', ['getToken']);
    spy.getToken.and.returnValue('mock-jwt-token-123');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CommentService,
        { provide: AuthService, useValue: spy }
      ]
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test: Fetch comments for a file
  it('should fetch comments for a file', () => {
    const mockComments = [
      { id: '1', fileId: 1, lineNumber: 5, content: 'Fix this bug', userId: 'admin' },
      { id: '2', fileId: 1, lineNumber: 12, content: 'Good logic @vishvjeet', userId: 'amitrai' }
    ];

    service.getFileComments(1).subscribe(comments => {
      expect(comments.length).toBe(2);
      expect(comments[0].lineNumber).toBe(5);
      expect(comments[1].content).toContain('@vishvjeet');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/comments/file/1');
    expect(req.request.method).toBe('GET');
    // Verify Authorization header is set
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-123');
    req.flush(mockComments);
  });

  // Test: Add a new comment (triggers mention notification)
  it('should add a comment with mention', () => {
    const newComment = {
      fileId: 1,
      lineNumber: 10,
      content: 'Hey @amitrai, check this function!',
      userId: 'admin'
    };
    const mockResponse = { id: '3', ...newComment };

    service.addComment(newComment).subscribe(comment => {
      expect(comment.id).toBe('3');
      expect(comment.content).toContain('@amitrai');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/comments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newComment);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-123');
    req.flush(mockResponse);
  });

  // Test: Delete a comment
  it('should delete a comment by ID', () => {
    service.deleteComment('abc123').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/comments/abc123');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-123');
    req.flush(null);
  });

  // Test: Resolve/Unresolve a comment
  it('should resolve a comment', () => {
    service.resolveComment('abc123', true).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/comments/abc123/resolve?resolved=true');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-123');
    req.flush({});
  });

  // Test: Verify auth token is always attached
  it('should call AuthService.getToken for every request', () => {
    service.getFileComments(1).subscribe();

    httpMock.expectOne('http://localhost:8080/api/comments/file/1').flush([]);

    expect(authServiceSpy.getToken).toHaveBeenCalled();
  });
});
