import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensures no outstanding HTTP requests remain
    localStorage.clear();
  });

  // Test 1: Service should be created
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test 2: Login should store token and update currentUser
  it('should login and store user in localStorage', () => {
    const mockResponse = {
      accessToken: 'mock-jwt-token-123',
      user: { username: 'testuser', role: 'USER' }
    };

    service.login({ username: 'testuser', password: 'pass123' }).subscribe(response => {
      expect(response.accessToken).toBe('mock-jwt-token-123');
      expect(response.user.username).toBe('testuser');
      // Verify it was stored in localStorage
      expect(localStorage.getItem('currentUser')).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'testuser', password: 'pass123' });
    req.flush(mockResponse);
  });

  // Test 3: Register should make POST request
  it('should register a new user', () => {
    const newUser = { username: 'newuser', email: 'new@test.com', password: 'pass123' };
    const mockResponse = { message: 'User registered successfully' };

    service.register(newUser).subscribe(response => {
      expect(response.message).toBe('User registered successfully');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(mockResponse);
  });

  // Test 4: Logout should clear localStorage and currentUser
  it('should clear user data on logout', () => {
    // Simulate logged-in state
    localStorage.setItem('currentUser', JSON.stringify({ accessToken: 'token' }));

    service.logout();

    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(service.currentUserValue).toBeNull();
  });

  // Test 5: isLoggedIn should return correct boolean
  it('should return false when no user is logged in', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  // Test 6: getToken should return the JWT token
  it('should return null token when not logged in', () => {
    expect(service.getToken()).toBeUndefined();
  });

  // Test 7: getAllUsers should fetch users (Admin endpoint)
  it('should fetch all users for admin', () => {
    const mockUsers = [
      { id: 1, username: 'admin', role: 'ADMIN' },
      { id: 2, username: 'user1', role: 'USER' }
    ];

    service.getAllUsers().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users[0].username).toBe('admin');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  // Test 8: deleteUser should send DELETE request
  it('should delete a user by ID', () => {
    service.deleteUser(5).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/users/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
