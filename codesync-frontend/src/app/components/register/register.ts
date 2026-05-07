import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  user = { username: '', email: '', password: '' };
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.authService.register(this.user).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => {
        console.error('Registration error:', err);
        if (err.error && err.error.errors) {
          this.error = Object.values(err.error.errors).join(', ');
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Registration failed. Please try again.';
        }
        this.loading = false;
      }
    });
  }

  socialLogin(provider: string) {
    window.location.href = `http://localhost:8080/api/auth/oauth2/authorization/${provider}`;
  }
}
