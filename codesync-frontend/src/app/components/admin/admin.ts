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
  
  // Mock Collaboration Sessions
  collaborationSessions = [
    { id: 'sess-001', projectId: 1, activeUsers: ['amitrai', 'admin'], startedAt: new Date() },
    { id: 'sess-002', projectId: 2, activeUsers: ['developer'], startedAt: new Date() }
  ];

  // Mock Supported Languages
  supportedLanguages = [
    { id: 'js', name: 'JavaScript', image: 'node:18-alpine', status: 'Active' },
    { id: 'py', name: 'Python', image: 'python:3.10-alpine', status: 'Active' },
    { id: 'java', name: 'Java', image: 'openjdk:17-alpine', status: 'Active' }
  ];

  broadcastMessage = '';

  stats = {
    totalUsers: 0,
    totalProjects: 0,
    totalExecutions: 0,
    activeSessions: 0,
    systemHealth: 'Healthy'
  };

  newLanguage = { name: '', image: '' };

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
    this.stats.totalExecutions = this.executionJobs.length;
    this.stats.activeSessions = this.collaborationSessions.length;
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
    if (confirm('Are you sure you want to permanently delete this user?')) {
      this.authService.deleteUser(userId).subscribe(() => this.loadUsers());
    }
  }

  suspendUser(user: any) {
    if (confirm(`Are you sure you want to suspend ${user.username}?`)) {
      this.authService.suspendUser(user.username).subscribe(() => {
        user.isActive = false; // Optimistic update
      }, () => user.isActive = false); // fallback for mock
    }
  }

  reactivateUser(user: any) {
    this.authService.reactivateUser(user.username).subscribe(() => {
      user.isActive = true;
    }, () => user.isActive = true);
  }

  deleteProject(projectId: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(projectId).subscribe(() => this.loadProjects());
    }
  }

  cancelJob(jobId: string) {
    if (confirm('Are you sure you want to cancel this job?')) {
      this.executionService.cancelJob(jobId).subscribe(() => {
        const job = this.executionJobs.find(j => j.id === jobId);
        if (job) job.status = 'FAILED';
      }, () => {
         const job = this.executionJobs.find(j => j.id === jobId);
         if (job) job.status = 'CANCELLED';
      });
    }
  }

  terminateSession(sessionId: string) {
    if (confirm('Terminate this collaboration session?')) {
      this.collaborationSessions = this.collaborationSessions.filter(s => s.id !== sessionId);
      this.updateStats();
    }
  }

  addLanguage() {
    if (this.newLanguage.name && this.newLanguage.image) {
      this.supportedLanguages.push({
        id: this.newLanguage.name.toLowerCase(),
        name: this.newLanguage.name,
        image: this.newLanguage.image,
        status: 'Active'
      });
      this.newLanguage = { name: '', image: '' };
    }
  }

  removeLanguage(langId: string) {
    this.supportedLanguages = this.supportedLanguages.filter(l => l.id !== langId);
  }

  sendBroadcast() {
    if (this.broadcastMessage.trim()) {
      alert(`Broadcast sent: ${this.broadcastMessage}`);
      this.broadcastMessage = '';
    }
  }

  getLanguageUsage(langId: string): number {
    // Mock analytics percentage
    const seed = langId.charCodeAt(0) + langId.charCodeAt(langId.length - 1);
    return (seed % 60) + 20; 
  }
}
