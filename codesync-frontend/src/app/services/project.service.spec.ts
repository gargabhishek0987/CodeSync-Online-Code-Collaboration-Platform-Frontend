import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test: Fetch user's projects
  it('should fetch user projects', () => {
    const mockProjects = [
      { id: 1, name: 'CodeSync', language: 'java' },
      { id: 2, name: 'Portfolio', language: 'javascript' }
    ];

    service.getProjects().subscribe(projects => {
      expect(projects.length).toBe(2);
      expect(projects[0].name).toBe('CodeSync');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/projects/user');
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });

  // Test: Fetch a single project by ID
  it('should fetch a single project by ID', () => {
    const mockProject = { id: 1, name: 'CodeSync', language: 'java', ownerId: 'admin' };

    service.getProject(1).subscribe(project => {
      expect(project.name).toBe('CodeSync');
      expect(project.ownerId).toBe('admin');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/projects/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });

  // Test: Create a new project
  it('should create a new project', () => {
    const newProject = { name: 'NewApp', language: 'python', visibility: 'PUBLIC' };
    const mockResponse = { id: 3, ...newProject, ownerId: 'admin' };

    service.createProject(newProject).subscribe(project => {
      expect(project.id).toBe(3);
      expect(project.name).toBe('NewApp');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProject);
    req.flush(mockResponse);
  });

  // Test: Delete a project
  it('should delete a project by ID', () => {
    service.deleteProject(1).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/projects/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Test: Fetch public projects with search query
  it('should fetch public projects with search query', () => {
    const mockResults = [{ id: 5, name: 'OpenSource' }];

    service.getPublicProjects('open', '').subscribe(projects => {
      expect(projects.length).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url.includes('/public') && r.url.includes('query=open'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResults);
  });

  // Test: Update project synopsis
  it('should update project synopsis', () => {
    const synopsis = { actors: ['Admin', 'User'], useCases: ['Login'], requirements: ['JWT Auth'] };
    const mockResponse = { id: 1, name: 'CodeSync', synopsis };

    service.updateSynopsis(1, synopsis).subscribe(project => {
      expect(project.synopsis.actors.length).toBe(2);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/projects/1/synopsis');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(synopsis);
    req.flush(mockResponse);
  });
});
