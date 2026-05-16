import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VersionService } from './version.service';

describe('VersionService', () => {
  let service: VersionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VersionService]
    });
    service = TestBed.inject(VersionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test: Create a new snapshot (version commit)
  it('should create a snapshot with commit message', () => {
    const mockSnapshot = { id: 'snap-001', commitMessage: 'Initial commit', branch: 'main' };

    service.createSnapshot(1, 'public class Main {}', 'Initial commit').subscribe(snapshot => {
      expect(snapshot.id).toBe('snap-001');
      expect(snapshot.commitMessage).toBe('Initial commit');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/versions/snapshot');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      fileId: 1,
      content: 'public class Main {}',
      commitMessage: 'Initial commit',
      branch: 'main'
    });
    req.flush(mockSnapshot);
  });

  // Test: Fetch version history for a file
  it('should fetch version history for a file', () => {
    const mockHistory = [
      { id: 'snap-002', commitMessage: 'Added login', createdAt: '2026-05-15T10:00:00' },
      { id: 'snap-001', commitMessage: 'Initial commit', createdAt: '2026-05-14T08:00:00' }
    ];

    service.getHistory(1).subscribe(history => {
      expect(history.length).toBe(2);
      // History should be ordered newest first
      expect(history[0].commitMessage).toBe('Added login');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/versions/file/1/history');
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);
  });

  // Test: Fetch a specific snapshot by ID
  it('should fetch a specific snapshot', () => {
    const mockSnapshot = { id: 'snap-001', content: 'public class Main {}', commitMessage: 'Initial' };

    service.getSnapshot('snap-001').subscribe(snapshot => {
      expect(snapshot.content).toContain('public class Main');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/versions/snap-001');
    expect(req.request.method).toBe('GET');
    req.flush(mockSnapshot);
  });

  // Test: Calculate diff between two versions
  it('should get diff between two versions', () => {
    const mockDiff = {
      snapshotId1: 'v1',
      snapshotId2: 'v2',
      diffLines: [
        { type: 'ADDED', line: 'System.out.println("Hello");' },
        { type: 'DELETED', line: 'System.out.println("World");' }
      ]
    };

    service.getDiff('v1', 'v2').subscribe(diff => {
      expect(diff.diffLines.length).toBe(2);
      expect(diff.diffLines[0].type).toBe('ADDED');
    });

    const req = httpMock.expectOne(r =>
      r.url === 'http://localhost:8080/api/versions/diff' &&
      r.params.get('v1') === 'v1' &&
      r.params.get('v2') === 'v2'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockDiff);
  });
});
