import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

/**
 * Unit Tests for AuthService (Angular)
 *
 * Tools used:
 * - Jasmine   : Test framework (describe, it, expect, beforeEach, afterEach)
 * - Karma     : Test runner (runs tests in browser)
 * - HttpClientTestingModule : Replaces real HttpClient with a mock
 * - HttpTestingController   : Intercepts HTTP requests and returns fake data
 *
 * KEY CONCEPT:
 * We never make REAL HTTP calls in unit tests.
 * HttpTestingController lets us intercept calls and return mock data.
 */
describe('AuthService - Unit Tests', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:8080/api/auth';

  // ─── Setup: runs before EACH test ───────────────────────────────────────
  beforeEach(() => {
    localStorage.clear(); // always start with clean storage

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],   // fake HTTP module
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // ─── Teardown: runs after EACH test ─────────────────────────────────────
  afterEach(() => {
    httpMock.verify();    // fail if any HTTP request was NOT handled
    localStorage.clear();
  });

  // ════════════════════════════════════════════════════════════════════════
  //  BASIC CREATION TEST
  // ════════════════════════════════════════════════════════════════════════

  it('✅ should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  // ════════════════════════════════════════════════════════════════════════
  //  LOGIN TESTS
  // ════════════════════════════════════════════════════════════════════════

  it('✅ login() → should POST credentials and store token in localStorage', () => {
    // ARRANGE: mock API response
    const mockResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.mockToken',
      tokenType: 'Bearer',
      user: { id: 1, username: 'john', email: 'john@test.com', role: 'DEVELOPER' }
    };
    const credentials = { usernameOrEmail: 'john', password: 'pass123' };

    // ACT: call login and subscribe to verify response
    service.login(credentials).subscribe(response => {
      // ASSERT response shape
      expect(response.accessToken).toBe('eyJhbGciOiJIUzI1NiJ9.mockToken');
      expect(response.tokenType).toBe('Bearer');
      expect(response.user.username).toBe('john');

      // ASSERT: user is stored in localStorage (this is what login() does via tap())
      const stored = JSON.parse(localStorage.getItem('currentUser')!);
      expect(stored.accessToken).toBe('eyJhbGciOiJIUzI1NiJ9.mockToken');
    });

    // INTERCEPT the HTTP request and flush mock data
    const req = httpMock.expectOne(`${API_URL}/login`);
    expect(req.request.method).toBe('POST');          // must be POST
    expect(req.request.body).toEqual(credentials);    // must send credentials
    req.flush(mockResponse);                          // return mock data
  });

  it('✅ login() → should update currentUserValue after login', () => {
    const mockResponse = {
      accessToken: 'test-token',
      user: { username: 'john' }
    };

    // Initially null
    expect(service.currentUserValue).toBeNull();

    service.login({ usernameOrEmail: 'john', password: '123' }).subscribe(() => {
      // After login, should have user
      expect(service.currentUserValue).toBeTruthy();
      expect(service.currentUserValue.accessToken).toBe('test-token');
    });

    httpMock.expectOne(`${API_URL}/login`).flush(mockResponse);
  });

  it('✅ login() → should handle 401 Unauthorized error', () => {
    let errorOccurred = false;

    service.login({ usernameOrEmail: 'john', password: 'wrongpass' }).subscribe({
      next: () => fail('should not succeed'),
      error: (err) => {
        errorOccurred = true;
        expect(err.status).toBe(401);
      }
    });

    // Simulate server returning 401
    httpMock.expectOne(`${API_URL}/login`).flush(
      { message: 'Bad credentials' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(errorOccurred).toBeTrue();
  });

  // ════════════════════════════════════════════════════════════════════════
  //  REGISTER TESTS
  // ════════════════════════════════════════════════════════════════════════

  it('✅ register() → should POST new user data to /register', () => {
    const newUser = {
      username: 'newuser',
      email: 'new@test.com',
      password: 'SecurePass123!'
    };
    const mockResponse = { message: 'User registered successfully.' };

    service.register(newUser).subscribe(response => {
      expect(response.message).toBe('User registered successfully.');
    });

    const req = httpMock.expectOne(`${API_URL}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.username).toBe('newuser');
    expect(req.request.body.email).toBe('new@test.com');
    req.flush(mockResponse);
  });

  it('✅ register() → should handle 400 error when username is taken', () => {
    let errorMessage = '';

    service.register({ username: 'admin', email: 'x@x.com', password: '123' }).subscribe({
      next: () => fail('should not succeed'),
      error: (err) => {
        errorMessage = err.error.message;
      }
    });

    httpMock.expectOne(`${API_URL}/register`).flush(
      { message: 'Username is already taken!' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(errorMessage).toBe('Username is already taken!');
  });

  // ════════════════════════════════════════════════════════════════════════
  //  LOGOUT TESTS
  // ════════════════════════════════════════════════════════════════════════

  it('✅ logout() → should remove user from localStorage', () => {
    // Simulate logged-in state
    localStorage.setItem('currentUser', JSON.stringify({ accessToken: 'some-token' }));

    service.logout();

    // ASSERT: localStorage is cleared
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  it('✅ logout() → should set currentUserValue to null', () => {
    // Simulate logged-in state
    localStorage.setItem('currentUser', JSON.stringify({ accessToken: 'token' }));

    service.logout();

    expect(service.currentUserValue).toBeNull();
  });

  // ════════════════════════════════════════════════════════════════════════
  //  AUTH STATE TESTS
  // ════════════════════════════════════════════════════════════════════════

  it('✅ isLoggedIn() → should return false when no user is in localStorage', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('✅ isLoggedIn() → should return true when user exists in localStorage', () => {
    localStorage.setItem('currentUser', JSON.stringify({ accessToken: 'valid-token' }));

    // Re-create service to pick up localStorage value in constructor
    service = new AuthService(TestBed.inject(HttpClient));

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('✅ getToken() → should return undefined when not logged in', () => {
    expect(service.getToken()).toBeUndefined();
  });

  it('✅ getToken() → should return the accessToken from currentUserValue', () => {
    localStorage.setItem('currentUser', JSON.stringify({ accessToken: 'my-jwt-token' }));

    // Re-create service so constructor picks up localStorage
    service = new AuthService(TestBed.inject(HttpClient));

    expect(service.getToken()).toBe('my-jwt-token');
  });

  // ════════════════════════════════════════════════════════════════════════
  //  PROFILE TESTS
  // ════════════════════════════════════════════════════════════════════════

  it('✅ updateProfile() → should PUT profile data to /profile', () => {
    const profileUpdate = { bio: 'Full stack dev', avatarUrl: 'http://img.com/avatar.png' };
    const mockResponse = { id: 1, username: 'john', bio: 'Full stack dev' };

    service.updateProfile(profileUpdate).subscribe(response => {
      expect(response.bio).toBe('Full stack dev');
    });

    const req = httpMock.expectOne(`${API_URL}/profile`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.bio).toBe('Full stack dev');
    req.flush(mockResponse);
  });

  it('✅ changePassword() → should PUT to /profile/password', () => {
    const passwords = { oldPassword: 'old123', newPassword: 'new456' };

    service.changePassword(passwords).subscribe();

    const req = httpMock.expectOne(`${API_URL}/profile/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.oldPassword).toBe('old123');
    req.flush({ message: 'Password updated successfully' });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  ADMIN TESTS
  // ════════════════════════════════════════════════════════════════════════

  it('✅ getAllUsers() → should GET all users from /users', () => {
    const mockUsers = [
      { id: 1, username: 'admin', role: 'ADMIN' },
      { id: 2, username: 'john', role: 'DEVELOPER' },
      { id: 3, username: 'jane', role: 'DEVELOPER' }
    ];

    service.getAllUsers().subscribe(users => {
      expect(users.length).toBe(3);
      expect(users[0].role).toBe('ADMIN');
      expect(users[1].username).toBe('john');
    });

    const req = httpMock.expectOne(`${API_URL}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('✅ deleteUser() → should send DELETE request with correct user ID', () => {
    service.deleteUser(42).subscribe();

    const req = httpMock.expectOne(`${API_URL}/users/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null); // DELETE usually returns 204 No Content
  });

  it('✅ deleteUser() → should handle 403 Forbidden (non-admin trying to delete)', () => {
    let errorStatus = 0;

    service.deleteUser(1).subscribe({
      next: () => fail('should not succeed'),
      error: (err) => { errorStatus = err.status; }
    });

    httpMock.expectOne(`${API_URL}/users/1`).flush(
      { message: 'Access Denied' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(errorStatus).toBe(403);
  });
});
