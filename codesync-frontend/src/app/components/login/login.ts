import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credentials = { usernameOrEmail: '', password: '' };
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.authService.login(this.credentials).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        console.error('Login error:', err);
        if (err.error && err.error.errors) {
          this.error = Object.values(err.error.errors).join(', ');
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Invalid credentials or server error';
        }
        this.loading = false;
      }
    });
  }

  socialLogin(provider: string) {
    window.location.href = `http://localhost:8080/api/auth/oauth2/authorization/${provider}`;
  }
}
