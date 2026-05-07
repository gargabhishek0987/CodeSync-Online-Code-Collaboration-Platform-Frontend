import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h4>Completing Social Login...</h4>
        <p class="text-muted">Please wait while we finalize your authentication.</p>
      </div>
    </div>
  `
})
export class OAuth2CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        // Decode JWT to get username
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            accessToken: token,
            tokenType: 'Bearer',
            username: payload.sub,
            id: payload.sub // Use sub as ID for notification topic matching
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          console.log('OAuth2: User decoded from token:', user);
          window.location.href = '/dashboard';
        } catch (e) {
          console.error('Error decoding OAuth2 token:', e);
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login'], { queryParams: { error: 'OAuth2 login failed' } });
      }
    });
  }
}
