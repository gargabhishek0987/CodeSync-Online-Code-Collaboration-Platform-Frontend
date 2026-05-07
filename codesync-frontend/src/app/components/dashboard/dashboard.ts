import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  projects: any[] = [];
  newProject = { name: '', description: '', language: 'javascript', visibility: 'PRIVATE' };
  showModal = false;
  error = '';

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: data => this.projects = data,
      error: err => console.error('Failed to load projects', err)
    });
  }

  createProject() {
    this.error = '';
    this.projectService.createProject(this.newProject).subscribe({
      next: () => {
        this.loadProjects();
        this.showModal = false;
        this.newProject = { name: '', description: '', language: 'javascript', visibility: 'PRIVATE' };
      },
      error: err => {
        console.error('Project creation failed', err);
        if (err.error && err.error.errors) {
          this.error = Object.values(err.error.errors).join(', ');
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Failed to create project';
        }
      }
    });
  }

  deleteProject(id: number) {
    if (confirm('Are you sure?')) {
      this.projectService.deleteProject(id).subscribe(() => {
        this.loadProjects();
      });
    }
  }
}
