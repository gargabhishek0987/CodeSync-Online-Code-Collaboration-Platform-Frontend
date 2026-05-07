import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { ExecutionService } from '../../services/execution.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  activeTab: string = 'users';
  users: any[] = [];
  projects: any[] = [];
  executionJobs: any[] = [];
  stats = {
    totalUsers: 0,
    totalProjects: 0,
    activeSessions: 0,
    systemHealth: 'Healthy'
  };

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private executionService: ExecutionService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadProjects();
    this.loadExecutionJobs();
  }

  updateStats() {
    this.stats.totalUsers = this.users.length;
    this.stats.totalProjects = this.projects.length;
    this.stats.activeSessions = this.executionJobs.filter(j => j.status === 'RUNNING' || j.status === 'PENDING').length;
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe(data => {
      this.users = data;
      this.updateStats();
    });
  }

  loadProjects() {
    this.projectService.getPublicProjects().subscribe(data => {
      this.projects = data;
      this.updateStats();
    });
  }

  loadExecutionJobs() {
    this.executionService.getAllJobs().subscribe(data => {
      this.executionJobs = data;
      this.updateStats();
    });
  }

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(userId).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  deleteProject(projectId: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(projectId).subscribe(() => {
        this.loadProjects();
      });
    }
  }
}
