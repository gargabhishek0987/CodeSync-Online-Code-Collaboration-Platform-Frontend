import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent implements OnInit {
  publicProjects: any[] = [];
  searchQuery = '';
  searchLanguage = '';

  features = [
    {
      title: 'Real-time Collaboration',
      description: 'Code together with your team in real-time with zero latency and high-fidelity synchronization.',
      icon: 'bi-people-fill'
    },
    {
      title: 'Cloud Execution',
      description: 'Run your code instantly in the cloud with support for multiple languages and environments.',
      icon: 'bi-play-fill'
    },
    {
      title: 'Integrated Synopsis',
      description: 'Keep track of project actors, use cases, and requirements directly within your development environment.',
      icon: 'bi-clipboard-check-fill'
    }
  ];

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadPublicProjects();
  }

  loadPublicProjects() {
    this.projectService.getPublicProjects(this.searchLanguage, this.searchQuery).subscribe({
      next: data => this.publicProjects = data,
      error: err => console.error('Failed to load public projects', err)
    });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
