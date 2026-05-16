import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileService]
    });
    service = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test: Fetch all files for a project
  it('should fetch project files as a tree structure', () => {
    const mockFiles = [
      { id: 1, name: 'src', isFolder: true, children: [
        { id: 2, name: 'Main.java', isFolder: false, language: 'java' }
      ]},
      { id: 3, name: 'README.md', isFolder: false, language: 'text' }
    ];

    service.getProjectFiles(1).subscribe(files => {
      expect(files.length).toBe(2);
      expect(files[0].isFolder).toBeTrue();
      expect(files[0].children.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files/project/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockFiles);
  });

  // Test: Fetch a single file with content
  it('should fetch a single file with its content', () => {
    const mockFile = { id: 2, name: 'Main.java', content: 'public class Main {}', language: 'java' };

    service.getFile(2).subscribe(file => {
      expect(file.name).toBe('Main.java');
      expect(file.content).toContain('public class Main');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files/2');
    expect(req.request.method).toBe('GET');
    req.flush(mockFile);
  });

  // Test: Create a new file
  it('should create a new file', () => {
    const newFile = { projectId: 1, path: 'src/App.java', name: 'App.java', language: 'java', isFolder: false, content: '' };
    const mockResponse = { id: 10, ...newFile };

    service.createFile(newFile).subscribe(file => {
      expect(file.id).toBe(10);
      expect(file.name).toBe('App.java');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/files');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  // Test: Update file content (Auto-save)
  it('should update file content', () => {
    const updatedContent = 'public class App { public static void main() {} }';

    service.updateFileContent(2, updatedContent).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/files/2/content');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ content: updatedContent });
    req.flush({});
  });

  // Test: Delete a file
  it('should delete a file by ID', () => {
    service.deleteFile(2).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/files/2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Test: Rename a file
  it('should rename a file', () => {
    service.renameFile(2, 'NewMain.java').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/files/2/rename?newName=NewMain.java');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
