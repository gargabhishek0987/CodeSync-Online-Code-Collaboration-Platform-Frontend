import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  activeTab: string = 'general';
  user: any = {};
  passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
  emailData = { newEmail: '' };
  
  message = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = { ...this.authService.currentUserValue };
    this.emailData.newEmail = this.user.email;
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.message = '';
    this.error = '';
  }

  updateProfile() {
    this.loading = true;
    this.message = '';
    this.error = '';
    
    this.authService.updateProfile(this.user).subscribe({
      next: (res) => {
        this.message = 'Profile updated successfully';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.loading = false;
      }
    });
  }

  changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    this.authService.changePassword(this.passwordData).subscribe({
      next: () => {
        this.message = 'Password changed successfully';
        this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to change password';
        this.loading = false;
      }
    });
  }

  updateEmail() {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.authService.updateEmail(this.emailData).subscribe({
      next: () => {
        this.message = 'Email updated successfully';
        this.user.email = this.emailData.newEmail;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update email';
        this.loading = false;
      }
    });
  }
}
