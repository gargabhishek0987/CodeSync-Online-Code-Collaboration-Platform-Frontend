import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate() {
    const user = this.authService.currentUserValue;
    if (user && user.role === 'ADMIN') {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
