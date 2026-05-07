import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  dropdownOpen = false;
  notificationsOpen = false;
  notifications: any[] = [];
  unreadCount = 0;
  private notificationSub?: Subscription;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        const userId = user.id || user.username;
        if (userId) {
          console.log('Navbar: User detected, connecting to notifications...', userId);
          this.loadNotifications(userId);
          this.notificationService.connect(userId);
          
          this.notificationSub?.unsubscribe();
          this.notificationSub = this.notificationService.getNewNotifications().subscribe(notif => {
            console.log('Navbar: Received new notification!', notif);
            this.notifications.unshift(notif);
            this.unreadCount++;
            this.cdr.detectChanges();
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.notificationSub?.unsubscribe();
    this.notificationService.disconnect();
  }

  loadNotifications(userId: string) {
    this.notificationService.getNotifications(userId).subscribe(data => {
      this.notifications = data;
      this.unreadCount = data.filter(n => !n.read).length;
    });
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.dropdownOpen = false;
    }
  }

  markAsRead(notif: any) {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        notif.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
