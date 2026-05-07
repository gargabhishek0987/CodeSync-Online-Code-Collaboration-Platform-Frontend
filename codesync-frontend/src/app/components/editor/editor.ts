import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { FileService } from '../../services/file.service';
import { ExecutionService } from '../../services/execution.service';
import { ProjectService } from '../../services/project.service';
import { CollaborationService } from '../../services/collaboration.service';
import { VersionService } from '../../services/version.service';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule, NavbarComponent],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css']
})
export class EditorComponent implements OnInit {
  projectId!: number;
  files: any[] = [];
  selectedFile: any = null;
  editorInstance: any;
  editorOptions = { theme: 'vs-dark', language: 'javascript' };
  code: string = '';
  output: string = '';
  executing: boolean = false;
  activeTab: string = 'terminal';
  isTerminalOpen: boolean = true;
  
  toggleTerminal() {
    this.isTerminalOpen = !this.isTerminalOpen;
    this.cdr.detectChanges();
  }
  
  // Collaboration
  isRemoteChange: boolean = false;
  activeUsers: string[] = [];

  // Version Control
  history: any[] = [];
  commitMessage: string = '';
  showCommitModal: boolean = false;
  
  // Synopsis Modal
  showSynopsisModal: boolean = false;
  projectDetails: any = null;
  synopsis: any = { actors: [], useCases: [], requirements: [] };
  newActor: string = '';
  newUseCase: string = '';
  newRequirement: string = '';

  // File Operations Modals
  showCreateModal: boolean = false;
  isCreatingFolder: boolean = false;
  newItemName: string = '';
  itemToDelete: any = null;
  showDeleteModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private fileService: FileService,
    private executionService: ExecutionService,
    private projectService: ProjectService,
    private collaborationService: CollaborationService,
    private versionService: VersionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.projectId = +this.route.snapshot.params['projectId'];
    this.loadProjectDetails();
    this.loadFiles();
    this.setupCollaboration();
  }

  ngOnDestroy() {
    this.collaborationService.disconnect();
  }

  setupCollaboration() {
    const token = localStorage.getItem('token');
    if (token) {
      this.collaborationService.connect(this.projectId, token);
      
      this.collaborationService.getCodeChanges().subscribe(change => {
        if (change.fileId === this.selectedFile?.id && change.username !== localStorage.getItem('username')) {
          this.isRemoteChange = true;
          this.code = change.content;
          this.isRemoteChange = false;
        }
      });

      this.collaborationService.getPresence().subscribe(presence => {
        if (presence.status === 'JOINED') {
          if (!this.activeUsers.includes(presence.username)) {
            this.activeUsers.push(presence.username);
          }
        } else if (presence.status === 'LEFT') {
          this.activeUsers = this.activeUsers.filter(u => u !== presence.username);
        }
      });
    }
  }

  onEditorInit(editor: any) {
    this.editorInstance = editor;
    this.editorInstance.onDidChangeModelContent((event: any) => {
      if (!this.isRemoteChange && this.selectedFile) {
        this.collaborationService.sendCodeChange(this.projectId, {
          fileId: this.selectedFile.id,
          content: this.code,
          username: localStorage.getItem('username')
        });
      }
    });
  }

  loadProjectDetails() {
    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.projectDetails = project;
        if (project.synopsis) {
          this.synopsis = {
            actors: project.synopsis.actors || [],
            useCases: project.synopsis.useCases || [],
            requirements: project.synopsis.requirements || []
          };
        }
      },
      error: (err) => console.error('Error loading project details:', err)
    });
  }

  loadFiles() {
    console.log('Loading files for project:', this.projectId);
    this.fileService.getProjectFiles(this.projectId).subscribe({
      next: (data) => {
        console.log('Files loaded:', data);
        this.files = data;
        if (this.files.length > 0 && !this.selectedFile) {
          this.selectFile(this.files[0]);
        }
      },
      error: (err) => console.error('Error loading files:', err)
    });
  }

  createFile() {
    this.isCreatingFolder = false;
    this.newItemName = '';
    this.showCreateModal = true;
  }

  createFolder() {
    this.isCreatingFolder = true;
    this.newItemName = '';
    this.showCreateModal = true;
  }

  confirmCreate() {
    if (!this.newItemName.trim()) return;

    const name = this.newItemName.trim();
    const isFolder = this.isCreatingFolder;

    const payload = {
      projectId: this.projectId,
      path: name,
      name: name,
      language: isFolder ? null : this.getLanguageFromExtension(name),
      isFolder: isFolder,
      content: isFolder ? null : ''
    };

    this.fileService.createFile(payload).subscribe({
      next: (newFile) => {
        this.loadFiles();
        this.showCreateModal = false;
        if (!isFolder) {
          this.selectFile(newFile);
        }
      },
      error: (err) => alert('Error creating: ' + err.message)
    });
  }

  deleteFile(file: any, event: Event) {
    event.stopPropagation();
    this.itemToDelete = file;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.fileService.deleteFile(this.itemToDelete.id).subscribe({
      next: () => {
        this.loadFiles();
        if (this.selectedFile?.id === this.itemToDelete.id) {
          this.selectedFile = null;
          this.code = '';
        }
        this.showDeleteModal = false;
        this.itemToDelete = null;
      },
      error: (err) => alert('Error deleting: ' + err.message)
    });
  }

  renameFile(file: any, event: Event) {
    event.stopPropagation();
    const newName = prompt('Enter new name:', file.name);
    if (!newName || newName === file.name) return;

    this.fileService.renameFile(file.id, newName).subscribe({
      next: () => {
        this.loadFiles();
        if (this.selectedFile?.id === file.id) {
          this.selectedFile.name = newName;
        }
      },
      error: (err) => alert('Error renaming: ' + err.message)
    });
  }

  private getLanguageFromExtension(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'java': return 'java';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      default: return 'text';
    }
  }

  selectFile(file: any) {
    if (file.isFolder) return;
    
    console.log('Selecting file:', file);
    this.fileService.getFile(file.id).subscribe({
      next: (fullFile) => {
        console.log('Full file loaded:', fullFile);
        if (!this.selectedFile || this.selectedFile.id !== fullFile.id || this.selectedFile.content !== fullFile.content) {
          this.selectedFile = fullFile;
          this.code = fullFile.content || '';
          this.editorOptions = { ...this.editorOptions, language: fullFile.language || 'javascript' };
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error fetching file content:', err)
    });
  }

  saveFile() {
    if (!this.selectedFile) return;
    this.fileService.updateFileContent(this.selectedFile.id, this.code).subscribe(() => {
      console.log('File saved');
    });
  }

  runCode() {
    if (!this.selectedFile) return;
    this.isTerminalOpen = true;
    this.executing = true;
    this.output = 'Executing...';
    
    this.executionService.executeCode(this.selectedFile.language, this.code).subscribe(job => {
      this.pollResult(job.id);
    });
  }

  pollResult(jobId: string) {
    console.log('Polling result for job:', jobId);
    this.executionService.getJobStatus(jobId).subscribe(job => {
      console.log('Job status response:', job);
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        console.log('Job finished with status:', job.status);
        this.ngZone.run(() => {
          this.output = job.stdout || job.stderr || 'No output';
          this.executing = false;
          console.log('UI updated: executing =', this.executing);
          this.cdr.detectChanges();
        });
      } else {
        setTimeout(() => this.pollResult(jobId), 2000);
      }
    });
  }

  // Synopsis Methods
  toggleSynopsis() {
    this.showSynopsisModal = !this.showSynopsisModal;
    if (this.showSynopsisModal) {
      // Re-load to ensure we have latest
      this.loadProjectDetails();
    }
  }

  addActor() {
    if (this.newActor.trim()) {
      this.synopsis.actors.push(this.newActor.trim());
      this.newActor = '';
    }
  }

  removeActor(index: number) {
    this.synopsis.actors.splice(index, 1);
  }

  addUseCase() {
    if (this.newUseCase.trim()) {
      this.synopsis.useCases.push(this.newUseCase.trim());
      this.newUseCase = '';
    }
  }

  removeUseCase(index: number) {
    this.synopsis.useCases.splice(index, 1);
  }

  addRequirement() {
    if (this.newRequirement.trim()) {
      this.synopsis.requirements.push(this.newRequirement.trim());
      this.newRequirement = '';
    }
  }

  removeRequirement(index: number) {
    this.synopsis.requirements.splice(index, 1);
  }

  saveSynopsis() {
    this.projectService.updateSynopsis(this.projectId, this.synopsis).subscribe({
      next: (updatedProject) => {
        this.projectDetails = updatedProject;
        this.showSynopsisModal = false;
        alert('Synopsis updated successfully!');
      },
      error: (err) => {
        console.error('Error updating synopsis:', err);
        alert('Failed to update synopsis');
      }
    });
  }

  // Version Control Methods
  loadHistory() {
    if (!this.selectedFile) return;
    this.versionService.getHistory(this.selectedFile.id).subscribe(data => {
      this.history = data;
    });
  }

  openCommitModal() {
    if (!this.selectedFile) return;
    this.showCommitModal = true;
    this.commitMessage = '';
  }

  createSnapshot() {
    if (!this.selectedFile || !this.commitMessage.trim()) return;
    this.versionService.createSnapshot(this.selectedFile.id, this.code, this.commitMessage.trim()).subscribe(() => {
      this.showCommitModal = false;
      this.loadHistory();
      alert('Version saved successfully!');
    });
  }

  restoreVersion(snapshot: any) {
    if (confirm(`Restore file to version: ${snapshot.commitMessage}? Unsaved changes will be lost.`)) {
      this.code = snapshot.content;
      this.saveFile(); // Save the restored content
    }
  }
}
