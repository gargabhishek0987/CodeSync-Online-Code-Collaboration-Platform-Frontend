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

  it('should create a snapshot', () => {
    const mockSnapshot = { id: 'snap1', commitMessage: 'Initial' };
    const fileId = 123;
    const content = 'test content';
    const message = 'Initial commit';

    service.createSnapshot(fileId, content, message).subscribe(snapshot => {
      expect(snapshot).toEqual(mockSnapshot);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/versions/snapshot`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      fileId,
      content,
      commitMessage: message,
      branch: 'main'
    });
    req.flush(mockSnapshot);
  });

  it('should get history for a file', () => {
    const mockHistory = [{ id: 'snap1' }, { id: 'snap2' }];
    const fileId = 123;

    service.getHistory(fileId).subscribe(history => {
      expect(history.length).toBe(2);
      expect(history).toEqual(mockHistory);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/versions/file/${fileId}/history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);
  });

  it('should get a specific snapshot', () => {
    const snapshotId = 'snap123';
    const mockSnapshot = { id: snapshotId, content: 'data' };

    service.getSnapshot(snapshotId).subscribe(snapshot => {
      expect(snapshot).toEqual(mockSnapshot);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/versions/${snapshotId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSnapshot);
  });

  it('should get diff between two versions', () => {
    const v1 = 'v1';
    const v2 = 'v2';
    const mockDiff = { diff: 'changes' };

    service.getDiff(v1, v2).subscribe(diff => {
      expect(diff).toEqual(mockDiff);
    });

    const req = httpMock.expectOne(req => 
      req.url === 'http://localhost:8080/api/versions/diff' && 
      req.params.get('v1') === v1 && 
      req.params.get('v2') === v2
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockDiff);
  });
});
