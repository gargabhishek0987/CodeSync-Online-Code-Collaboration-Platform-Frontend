import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExecutionService } from './execution.service';

describe('ExecutionService', () => {
  let service: ExecutionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExecutionService]
    });
    service = TestBed.inject(ExecutionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test: Submit code for execution
  it('should submit code for execution and return a job ID', () => {
    const mockResponse = { id: 'job-abc-123', status: 'QUEUED' };

    service.executeCode('java', 'System.out.println("Hello");').subscribe(job => {
      expect(job.id).toBe('job-abc-123');
      expect(job.status).toBe('QUEUED');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/execute');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      language: 'java',
      code: 'System.out.println("Hello");'
    });
    req.flush(mockResponse);
  });

  // Test: Poll job status - COMPLETED
  it('should poll job status and get result', () => {
    const mockResult = {
      id: 'job-abc-123',
      status: 'COMPLETED',
      stdout: 'Hello',
      stderr: ''
    };

    service.getJobStatus('job-abc-123').subscribe(job => {
      expect(job.status).toBe('COMPLETED');
      expect(job.stdout).toBe('Hello');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/execute/job-abc-123');
    expect(req.request.method).toBe('GET');
    req.flush(mockResult);
  });

  // Test: Poll job status - FAILED
  it('should handle failed execution', () => {
    const mockResult = {
      id: 'job-xyz-456',
      status: 'FAILED',
      stdout: '',
      stderr: 'Compilation error: missing semicolon'
    };

    service.getJobStatus('job-xyz-456').subscribe(job => {
      expect(job.status).toBe('FAILED');
      expect(job.stderr).toContain('Compilation error');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/execute/job-xyz-456');
    expect(req.request.method).toBe('GET');
    req.flush(mockResult);
  });

  // Test: Admin - fetch all jobs
  it('should fetch all execution jobs for admin', () => {
    const mockJobs = [
      { id: 'job-1', status: 'COMPLETED', language: 'java' },
      { id: 'job-2', status: 'FAILED', language: 'python' }
    ];

    service.getAllJobs().subscribe(jobs => {
      expect(jobs.length).toBe(2);
      expect(jobs[1].language).toBe('python');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/execute/admin/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockJobs);
  });
});
