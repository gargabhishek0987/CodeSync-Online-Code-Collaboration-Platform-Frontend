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
import { AuthService } from '../../services/auth.service';
import { CommentService } from '../../services/comment.service';

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
  selectedFolder: any = null;
  selectedFolderPath: string | null = null;
  expandedNodes: Set<string> = new Set<string>();
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
  isInlineCreating: boolean = false;
  inlineCreatingFolder: boolean = false;
  inlineItemName: string = '';
  itemToDelete: any = null;
  showDeleteModal: boolean = false;

  // Comments
  comments: any[] = [];
  showCommentBox: boolean = false;
  commentLineNumber: number = 0;
  newCommentContent: string = '';

  constructor(
    private route: ActivatedRoute,
    private fileService: FileService,
    private executionService: ExecutionService,
    private projectService: ProjectService,
    private collaborationService: CollaborationService,
    private versionService: VersionService,
    private authService: AuthService,
    private commentService: CommentService,
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
    const token = this.authService.getToken();
    const userObj = this.authService.currentUserValue;
    // The user details are nested inside the 'user' property of the login response
    const currentUsername = userObj?.user?.username || userObj?.username || userObj?.name || 'UnknownUser';
    
    console.log('Setting up collaboration. Token present:', !!token, 'User Identified:', currentUsername);

    if (token) {
      console.log('Attempting STOMP connection to: http://localhost:8080/ws-collab/ws');
      this.collaborationService.connect(this.projectId, token);
      
      this.collaborationService.getCodeChanges().subscribe(change => {
        if (change.fileId === this.selectedFile?.id && change.username !== currentUsername) {
          console.log('Received remote change from:', change.username);
          this.isRemoteChange = true;
          this.code = change.content;
          this.isRemoteChange = false;
        }
      });

      this.collaborationService.getPresence().subscribe(presence => {
        console.log('Presence update received:', presence);
        if (presence.activeUsers) {
          // Use the full list from server, excluding self (optional, we show self separately)
          this.activeUsers = presence.activeUsers.filter((u: string) => u !== currentUsername);
        }
      });
      
      // Listen for remote cursors
      this.collaborationService.getCursors().subscribe(cursor => {
        if (cursor.username !== currentUsername) {
          this.updateRemoteCursor(cursor);
        }
      });
    } else {
      console.warn('Collaboration not started: No valid token found in AuthService.');
    }
  }

  onEditorInit(editor: any) {
    this.editorInstance = editor;

    // Line numbers click detection for comments
    this.editorInstance.onMouseDown((e: any) => {
      // 2 = GUTTER_GLYPH_MARGIN, 3 = GUTTER_LINE_NUMBERS, 4 = GUTTER_LINE_DECORATIONS
      if (e.target.type === 2 || e.target.type === 3 || e.target.type === 4) {
        const lineNumber = e.target.position.lineNumber;
        this.openCommentBox(lineNumber);
      }
    });

    this.editorInstance.onDidChangeModelContent((event: any) => {
      if (!this.isRemoteChange && this.selectedFile && this.collaborationService.isConnected()) {
        const username = this.authService.currentUserValue?.user?.username || this.authService.currentUserValue?.username;
        this.collaborationService.sendCodeChange(this.projectId, {
          fileId: this.selectedFile.id,
          content: this.code,
          username: username
        });
      }
    });

    this.editorInstance.onDidChangeCursorPosition((e: any) => {
      if (this.selectedFile && this.collaborationService.isConnected()) {
        const username = this.authService.currentUserValue?.user?.username || this.authService.currentUserValue?.username;
        this.collaborationService.sendCursorMove(this.projectId, {
          username: username,
          fileId: this.selectedFile.id,
          lineNumber: e.position.lineNumber,
          column: e.position.column
        });
      }
    });
  }

  remoteCursorDecorations: Map<string, string[]> = new Map();

  updateRemoteCursor(cursor: any) {
    if (!this.editorInstance || !this.selectedFile || cursor.fileId !== this.selectedFile.id) return;

    const decorations = [
      {
        range: new (window as any).monaco.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column + 1),
        options: {
          className: `remote-cursor cursor-${cursor.username}`,
          beforeContentClassName: `remote-cursor-label label-${cursor.username}`,
          hoverMessage: { value: cursor.username }
        }
      }
    ];

    const oldDecorations = this.remoteCursorDecorations.get(cursor.username) || [];
    const newDecorations = this.editorInstance.deltaDecorations(oldDecorations, decorations);
    this.remoteCursorDecorations.set(cursor.username, newDecorations);
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
        // Auto-open first FILE only on initial load (when nothing is selected)
        if (!this.selectedFile && !this.selectedFolderPath) {
          const firstFile = this.findFirstFile(data);
          if (firstFile) this.selectFile(firstFile);
        }
      },
      error: (err) => console.error('Error loading files:', err)
    });
  }

  private findFirstFile(nodes: any[]): any {
    for (const node of nodes) {
      const isFolder = node.isFolder || node['folder'];
      const isDeleted = node.isDeleted || node['deleted'];
      
      if (!isFolder && !isDeleted) return node;
      if (node.children?.length) {
        const found = this.findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  createFile() {
    this.isInlineCreating = true;
    this.inlineCreatingFolder = false;
    this.inlineItemName = '';
    if (this.selectedFolderPath) this.expandedNodes.add(this.selectedFolderPath);
    setTimeout(() => {
      const el = document.getElementById('inline-input');
      if (el) el.focus();
    }, 50);
  }

  createFolder() {
    this.isInlineCreating = true;
    this.inlineCreatingFolder = true;
    this.inlineItemName = '';
    if (this.selectedFolderPath) this.expandedNodes.add(this.selectedFolderPath);
    setTimeout(() => {
      const el = document.getElementById('inline-input');
      if (el) el.focus();
    }, 50);
  }

  cancelInlineCreate() {
    setTimeout(() => {
      this.isInlineCreating = false;
    }, 200);
  }

  confirmInlineCreate() {
    if (!this.inlineItemName.trim()) {
      this.isInlineCreating = false;
      return;
    }

    const name = this.inlineItemName.trim();
    const isFolder = this.inlineCreatingFolder;
    const path = this.selectedFolderPath ? `${this.selectedFolderPath}/${name}` : name;

    const payload = {
      projectId: this.projectId,
      path: path,
      name: name,
      language: isFolder ? null : this.getLanguageFromExtension(name),
      isFolder: isFolder,
      content: isFolder ? null : ''
    };

    this.fileService.createFile(payload).subscribe({
      next: (newFile) => {
        if (isFolder) {
          this.selectedFolderPath = path;
          // Use the actual object from backend which HAS the ID
          this.selectedFolder = newFile;
          this.expandedNodes.add(path);
        }
        this.isInlineCreating = false;
        this.inlineItemName = '';
        this.loadFiles();
        if (!isFolder) {
          setTimeout(() => this.selectFile(newFile), 300);
        }
      },
      error: (err) => {
        alert('Error creating: ' + (err.error?.message || err.message));
        this.isInlineCreating = false;
      }
    });
  }

  deleteFile(file: any, event: Event) {
    event.stopPropagation();
    if (!file.id) {
      console.error('Cannot delete: Item has no ID', file);
      this.loadFiles(); // Refresh to try and get IDs
      return;
    }
    this.itemToDelete = file;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.fileService.deleteFile(this.itemToDelete.id).subscribe({
      next: () => {
        const deletedPath = this.itemToDelete.path;
        
        // Remove from expansion tracking
        this.expandedNodes.delete(deletedPath);
        
        // If current selection was inside deleted item, reset it
        if (this.selectedFolderPath?.startsWith(deletedPath)) {
          this.selectedFolderPath = null;
          this.selectedFolder = null;
        }
        
        if (this.selectedFile?.id === this.itemToDelete.id) {
          this.selectedFile = null;
          this.code = '';
        }
        
        this.showDeleteModal = false;
        this.itemToDelete = null;
        this.loadFiles();
      },
      error: (err) => alert('Error deleting: ' + (err.error?.message || err.message))
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
    // Handle both Jackson serializations: isFolder (with @JsonProperty) and folder (without)
    const isFolder = file.isFolder || file['folder'];
    if (isFolder) {
      this.selectedFolder = file;
      this.selectedFolderPath = file.path;
      this.selectedFile = null;
      this.toggleExpand(file.path);
      return;
    }
    // For a file, keep selectedFolderPath as-is so user can still create siblings
    
    console.log('Selecting file:', file);
    this.fileService.getFile(file.id).subscribe({
      next: (fullFile) => {
        console.log('Full file loaded:', fullFile);
        if (!this.selectedFile || this.selectedFile.id !== fullFile.id || this.selectedFile.content !== fullFile.content) {
          this.selectedFile = fullFile;
          this.code = fullFile.content || '';
          this.editorOptions = { ...this.editorOptions, language: fullFile.language || 'javascript' };
          this.loadComments();
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

  isExpanded(path: string): boolean {
    return this.expandedNodes.has(path);
  }

  toggleExpand(path: string) {
    if (this.expandedNodes.has(path)) {
      this.expandedNodes.delete(path);
    } else {
      this.expandedNodes.add(path);
    }
  }

  // Comment Methods
  loadComments() {
    if (!this.selectedFile) return;
    this.commentService.getFileComments(this.selectedFile.id).subscribe(data => {
      this.comments = data;
      this.updateCommentWidgets();
    });
  }

  openCommentBox(lineNumber: number) {
    this.commentLineNumber = lineNumber;
    this.newCommentContent = '';
    this.showCommentBox = true;
    this.cdr.detectChanges();
  }

  submitComment() {
    if (!this.newCommentContent.trim() || !this.selectedFile) return;
    
    const userObj = this.authService.currentUserValue;
    const currentUsername = userObj?.user?.username || userObj?.username || 'Anonymous';

    const comment = {
      fileId: this.selectedFile.id,
      lineNumber: this.commentLineNumber,
      content: this.newCommentContent.trim(),
      userId: currentUsername
    };

    this.commentService.addComment(comment).subscribe({
      next: () => {
        this.showCommentBox = false;
        this.loadComments();
      },
      error: (err) => alert('Error posting comment: ' + err.message)
    });
  }

  commentWidgets: any[] = [];
  updateCommentWidgets() {
    if (!this.editorInstance) return;
    
    // Clear old widgets if monaco is available
    // For simplicity in this demo, we'll just show them in a sidebar or overlay
    // But we'll at least trigger a UI refresh
    this.cdr.detectChanges();
  }
}
