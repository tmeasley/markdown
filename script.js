class MarkdownReader {
    constructor() {
        this.currentFile = null;
        this.isEditMode = false;
        this.fileHandle = null;
        this.directoryHandle = null;
        this.openFiles = new Map();
        this.activeFileId = 'untitled.md';
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeEditor();
        this.loadThemePreference();
        this.loadFontPreference();
    }

    initializeElements() {
        this.editor = document.getElementById('markdownEditor');
        this.preview = document.getElementById('markdownPreview');
        this.previewPane = document.getElementById('previewPane');
        this.editorPane = document.getElementById('editorPane');
        this.fileTree = document.getElementById('fileTree');
        this.tabContainer = document.getElementById('tabContainer');
        this.editToggle = document.getElementById('editToggle');
        this.saveBtn = document.getElementById('saveBtn');
        this.newFileBtn = document.getElementById('newFileBtn');
        this.openFolderBtn = document.getElementById('openFolderBtn');
        this.editorContainer = document.querySelector('.editor-container');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarResizer = document.getElementById('sidebarResizer');
        this.themeSelector = document.getElementById('themeSelector');
        this.fontSelector = document.getElementById('fontSelector');
    }

    attachEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => {
            this.markFileAsModified();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveFile();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.newFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openFolder();
                        break;
                    case 'w':
                        e.preventDefault();
                        this.closeFile();
                        break;
                }
            }
        });

        // Button events
        this.editToggle.addEventListener('click', () => this.toggleEditMode());
        this.saveBtn.addEventListener('click', () => this.saveFile());
        this.newFileBtn.addEventListener('click', () => this.newFile());
        this.openFolderBtn.addEventListener('click', () => this.openFolder());

        // Tab events
        this.tabContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) {
                const tab = e.target.closest('.tab');
                const fileId = tab.dataset.file;
                this.closeFile(fileId);
            } else if (e.target.closest('.tab')) {
                const tab = e.target.closest('.tab');
                const fileId = tab.dataset.file;
                this.switchToFile(fileId);
            }
        });

        // Auto-resize textarea
        this.editor.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Sidebar resizer
        this.initializeSidebarResizer();

        // Theme selector
        this.themeSelector.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // Font selector
        this.fontSelector.addEventListener('change', (e) => {
            this.changeFont(e.target.value);
        });
    }

    initializeSidebarResizer() {
        let isResizing = false;

        this.sidebarResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const rect = document.querySelector('.app-container').getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            
            // Constrain width
            const minWidth = 200;
            const maxWidth = Math.min(600, window.innerWidth * 0.5);
            const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            
            this.sidebar.style.width = constrainedWidth + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    changeTheme(themeName) {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Save preference
        localStorage.setItem('selectedTheme', themeName);
        
        console.log(`Theme changed to: ${themeName}`);
        console.log('Document data-theme attribute:', document.documentElement.getAttribute('data-theme'));
        
        // Force a style recalculation
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'warm-cream';
        this.themeSelector.value = savedTheme;
        this.changeTheme(savedTheme);
    }

    changeFont(fontName) {
        const fontMap = {
            'theme-default': null, // Use theme's default font
            'roboto': 'var(--font-roboto)',
            'inter': 'var(--font-inter)',
            'open-sans': 'var(--font-open-sans)',
            'lato': 'var(--font-lato)',
            'source-sans': 'var(--font-source-sans)',
            'georgia': 'var(--font-georgia)',
            'crimson': 'var(--font-crimson)',
            'merriweather': 'var(--font-merriweather)'
        };

        const selectedFont = fontMap[fontName];
        if (selectedFont) {
            document.documentElement.style.setProperty('--reading-font', selectedFont);
        } else {
            // Reset to theme default
            document.documentElement.style.removeProperty('--reading-font');
        }
        
        // Save preference
        localStorage.setItem('selectedFont', fontName);
        
        console.log(`Font changed to: ${fontName}`);
    }

    loadFontPreference() {
        const savedFont = localStorage.getItem('selectedFont') || 'theme-default';
        this.fontSelector.value = savedFont;
        this.changeFont(savedFont);
    }

    initializeEditor() {
        // Set initial content
        this.openFiles.set('untitled.md', {
            name: 'Welcome',
            content: '# Welcome to Your Beautiful Document Library\n\nThis is your clean, distraction-free reading and writing space.\n\n## Getting Started\n\n1. Click **Open Folder** to browse your markdown documents\n2. Click the **edit icon** when you want to make changes\n3. Use **Ctrl+S** to save your work\n\n## Features\n\n- **Clean Reading**: No code syntax, just beautiful formatted text\n- **Focused Writing**: Edit mode when you need it\n- **Simple Library**: Only your markdown files, nothing else\n- **Elegant Design**: Soft cream colors for comfortable reading\n\n*Enjoy your peaceful writing experience!*',
            modified: false,
            handle: null
        });
        
        this.editor.value = this.openFiles.get('untitled.md').content;
        this.updatePreview();
    }

    autoResizeTextarea() {
        // This could be expanded for auto-resizing functionality
        // For now, keeping it simple with CSS flex
    }

    updatePreview() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        if (fileInfo) {
            this.preview.innerHTML = marked.parse(fileInfo.content);
        }
    }

    htmlToMarkdown(html) {
        // Simple HTML to Markdown conversion
        let markdown = html;
        
        // Convert headers
        markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
        markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
        markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
        markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
        
        // Convert paragraphs
        markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
        
        // Convert line breaks
        markdown = markdown.replace(/<br[^>]*>/gi, '\n');
        
        // Convert bold and italic
        markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        
        // Convert lists
        markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n');
        markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n');
        markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        
        // Convert blockquotes
        markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');
        
        // Clean up extra whitespace
        markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
        markdown = markdown.trim();
        
        return markdown;
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        console.log(`Toggling edit mode: ${this.isEditMode ? 'ON' : 'OFF'}`);
        console.log('Editor element:', this.editor);
        console.log('Editor pane element:', this.editorPane);
        
        if (this.isEditMode) {
            // Switch to edit mode
            console.log('Switching to edit mode...');
            this.editorPane.style.display = 'flex';
            this.previewPane.style.display = 'none';
            this.editorContainer.classList.add('edit-mode');
            this.editToggle.innerHTML = '<i class="fas fa-book-open"></i>';
            this.editToggle.title = 'Reading Mode';
            
            // Make sure editor has current content
            const fileInfo = this.openFiles.get(this.activeFileId);
            if (fileInfo) {
                // Convert markdown to HTML for rich editing
                this.editor.innerHTML = marked.parse(fileInfo.content);
                console.log('Set editor content as HTML');
            }
            
            // Force the editor to be visible
            this.editor.style.display = 'block';
            
            // Focus after a brief delay to ensure display is updated
            setTimeout(() => {
                this.editor.focus();
                console.log('Editor focused');
            }, 100);
        } else {
            // Switch to reading mode - save current editor content first
            console.log('Switching to reading mode...');
            const fileInfo = this.openFiles.get(this.activeFileId);
            if (fileInfo) {
                // Convert HTML back to markdown (simplified approach)
                fileInfo.content = this.htmlToMarkdown(this.editor.innerHTML);
                this.markFileAsModified();
            }
            
            this.editorPane.style.display = 'none';
            this.previewPane.style.display = 'block';
            this.editorContainer.classList.remove('edit-mode');
            this.editToggle.innerHTML = '<i class="fas fa-edit"></i>';
            this.editToggle.title = 'Edit Mode';
            this.updatePreview();
        }
    }

    async openFolder() {
        if (!('showDirectoryPicker' in window)) {
            alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        try {
            this.directoryHandle = await window.showDirectoryPicker();
            await this.loadFileTree();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening folder:', error);
                alert('Error opening folder: ' + error.message);
            }
        }
    }

    async loadFileTree() {
        if (!this.directoryHandle) return;

        // Show loading spinner
        this.fileTree.innerHTML = '<div class="no-folder"><i class="fas fa-spinner fa-spin"></i><p>Loading your library...</p></div>';
        
        try {
            // Create a temporary container for the content
            const tempContainer = document.createElement('div');
            
            await this.renderDirectoryContents(this.directoryHandle, tempContainer);
            
            // Replace the spinner with the loaded content
            this.fileTree.innerHTML = '';
            
            // Move all children from temp container to file tree
            while (tempContainer.firstChild) {
                this.fileTree.appendChild(tempContainer.firstChild);
            }
            
            // If no markdown files found, show helpful message
            if (this.fileTree.children.length === 0) {
                this.fileTree.innerHTML = '<div class="no-folder"><i class="fas fa-book"></i><p>No markdown files found</p><small>Looking for .md, .txt, .markdown files</small></div>';
            }
            
            
        } catch (error) {
            console.error('Error loading file tree:', error);
            this.fileTree.innerHTML = '<div class="no-folder"><i class="fas fa-exclamation-triangle"></i><p>Error accessing folder</p><small>Please try selecting a different folder</small></div>';
        }
    }

    async renderDirectoryContents(dirHandle, container, level = 0) {
        if (level > 10) {
            console.log(`Stopping at level ${level} to prevent deep recursion`);
            return; // Prevent deep recursion
        }
        
        const entries = [];
        
        try {
            let entryCount = 0;
            let fileCount = 0;
            let dirCount = 0;
            
            for await (const [name, handle] of dirHandle.entries()) {
                if (entryCount > 1000) break; // Prevent massive directories
                
                // Skip hidden files and system directories
                if (name.startsWith('.') || name.startsWith('$') || name === 'node_modules' || name === '__pycache__') {
                    continue;
                }
                
                // Include all directories and markdown files
                if (handle.kind === 'directory') {
                    entries.push({ name, handle });
                    dirCount++;
                    entryCount++;
                } else if (this.isMarkdownFile(name)) {
                    console.log(`Adding markdown file to display: ${name}`);
                    entries.push({ name, handle });
                    fileCount++;
                    entryCount++;
                } else {
                    console.log(`Skipping non-markdown file: ${name}`);
                }
            }
            
            console.log(`Level ${level} scan: ${fileCount} markdown files, ${dirCount} directories found`);
            
        } catch (error) {
            console.error('Error reading directory:', error);
            return;
        }

        // Sort: directories first, then files
        entries.sort((a, b) => {
            if (a.handle.kind !== b.handle.kind) {
                return a.handle.kind === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        for (const { name, handle } of entries) {
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.style.paddingLeft = `${16 + (level * 20)}px`;
            
            let displayName = name;
            if (handle.kind === 'file') {
                // Remove .md extension from display name
                displayName = name.replace(/\.(md|markdown)$/i, '');
            }
            
            if (handle.kind === 'directory') {
                item.innerHTML = `<i class="fas fa-chevron-right folder-toggle"></i><i class="fas fa-folder"></i><span>${displayName}</span>`;
                item.classList.add('folder-item');
                item.dataset.expanded = 'false';
                
                const subContainer = document.createElement('div');
                subContainer.className = 'folder-contents';
                subContainer.style.display = 'none';
                
                // Add click handler for folder toggle
                item.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isExpanded = item.dataset.expanded === 'true';
                    const toggle = item.querySelector('.folder-toggle');
                    
                    if (!isExpanded) {
                        // Expand folder
                        item.dataset.expanded = 'true';
                        toggle.classList.remove('fa-chevron-right');
                        toggle.classList.add('fa-chevron-down');
                        subContainer.style.display = 'block';
                        
                        // Load contents if not loaded yet
                        if (subContainer.children.length === 0) {
                            await this.renderDirectoryContents(handle, subContainer, level + 1);
                        }
                    } else {
                        // Collapse folder
                        item.dataset.expanded = 'false';
                        toggle.classList.remove('fa-chevron-down');
                        toggle.classList.add('fa-chevron-right');
                        subContainer.style.display = 'none';
                    }
                });
                
                container.appendChild(item);
                container.appendChild(subContainer);
            } else {
                // File item
                const icon = '<i class="fas fa-file-text"></i>';
                item.innerHTML = `${icon}<span>${displayName}</span>`;
                item.addEventListener('click', () => this.openFileFromTree(handle, name));
                item.style.cursor = 'pointer';
                container.appendChild(item);
            }
        }
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'md': '<i class="fab fa-markdown"></i>',
            'txt': '<i class="fas fa-file-alt"></i>',
            'js': '<i class="fab fa-js-square"></i>',
            'html': '<i class="fab fa-html5"></i>',
            'css': '<i class="fab fa-css3-alt"></i>',
            'json': '<i class="fas fa-code"></i>',
            'py': '<i class="fab fa-python"></i>',
            'jpg': '<i class="fas fa-image"></i>',
            'png': '<i class="fas fa-image"></i>',
            'gif': '<i class="fas fa-image"></i>',
            'svg': '<i class="fas fa-image"></i>'
        };
        return iconMap[ext] || '<i class="fas fa-file"></i>';
    }

    isMarkdownFile(filename) {
        const nameLower = filename.toLowerCase();
        
        // Check extensions
        const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
        const markdownExts = ['md', 'markdown', 'txt', 'text', 'mdown', 'mkd', 'mdx'];
        
        if (markdownExts.includes(ext)) {
            return true;
        }
        
        // Also check common markdown filenames without extensions
        const markdownNames = ['readme', 'changelog', 'license', 'todo', 'notes'];
        const baseNameLower = filename.includes('.') ? filename.split('.')[0].toLowerCase() : nameLower;
        
        return markdownNames.includes(baseNameLower);
    }

    async openFileFromTree(fileHandle, filename) {
        try {
            const file = await fileHandle.getFile();
            
            // Check file size (prevent opening huge files)
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File is too large to open (over 10MB)');
                return;
            }
            
            const content = await file.text();
            const fileId = filename;
            
            // Add to open files
            this.openFiles.set(fileId, {
                name: filename.replace(/\.(md|markdown)$/i, ""), // Remove markdown extension for display
                content: content,
                modified: false,
                handle: fileHandle
            });
            
            this.createTab(fileId);
            this.switchToFile(fileId);
            
        } catch (error) {
            console.error('Error opening file:', error);
            
            let message = 'Could not open this file';
            if (error.name === 'NotAllowedError') {
                message = 'Permission denied - cannot access this file';
            } else if (error.name === 'NotFoundError') {
                message = 'File not found - it may have been moved or deleted';
            }
            
            alert(message);
        }
    }

    createTab(fileId) {
        // Remove existing tab if it exists
        const existingTab = document.querySelector(`[data-file="${fileId}"]`);
        if (existingTab) {
            existingTab.remove();
        }
        
        const fileInfo = this.openFiles.get(fileId);
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.file = fileId;
        tab.innerHTML = `
            <span class="tab-name">${fileInfo.name}${fileInfo.modified ? '*' : ''}</span>
            <span class="tab-close" title="Close">×</span>
        `;
        
        this.tabContainer.appendChild(tab);
    }

    switchToFile(fileId) {
        // Update active file
        this.activeFileId = fileId;
        
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-file="${fileId}"]`).classList.add('active');
        
        // Load file content
        const fileInfo = this.openFiles.get(fileId);
        if (this.isEditMode) {
            // Show as rich HTML if in edit mode
            this.editor.innerHTML = marked.parse(fileInfo.content);
        }
        this.updatePreview();
    }

    closeFile(fileId = null) {
        if (!fileId) fileId = this.activeFileId;
        
        const fileInfo = this.openFiles.get(fileId);
        if (fileInfo && fileInfo.modified) {
            if (!confirm(`"${fileInfo.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }
        
        // Remove tab
        const tab = document.querySelector(`[data-file="${fileId}"]`);
        if (tab) tab.remove();
        
        // Remove from open files
        this.openFiles.delete(fileId);
        
        // Switch to another file or create new one
        if (this.openFiles.size === 0) {
            this.newFile();
        } else {
            const remainingFiles = Array.from(this.openFiles.keys());
            this.switchToFile(remainingFiles[0]);
        }
    }

    newFile() {
        const timestamp = Date.now();
        const fileId = `untitled-${timestamp}.md`;
        
        this.openFiles.set(fileId, {
            name: 'Untitled',
            content: '',
            modified: false,
            handle: null
        });
        
        this.createTab(fileId);
        this.switchToFile(fileId);
    }

    async saveFile() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        if (!fileInfo) return;
        
        try {
            if (!fileInfo.handle) {
                // New file - need to save as
                await this.saveAsFile();
            } else {
                // Existing file - save directly
                const writable = await fileInfo.handle.createWritable();
                const contentToSave = this.isEditMode ? this.htmlToMarkdown(this.editor.innerHTML) : fileInfo.content;
                await writable.write(contentToSave);
                await writable.close();
                
                fileInfo.content = contentToSave;
                fileInfo.modified = false;
                this.updateTabTitle();
                
                console.log('File saved successfully');
            }
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file: ' + error.message);
        }
    }

    async saveAsFile() {
        if (!('showSaveFilePicker' in window)) {
            alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: 'untitled.md',
                types: [{
                    description: 'Markdown files',
                    accept: {
                        'text/markdown': ['.md', '.markdown'],
                        'text/plain': ['.txt']
                    }
                }]
            });

            const writable = await fileHandle.createWritable();
            const contentToSave = this.isEditMode ? this.htmlToMarkdown(this.editor.innerHTML) : this.openFiles.get(this.activeFileId).content;
            await writable.write(contentToSave);
            await writable.close();

            // Update file info
            const fileInfo = this.openFiles.get(this.activeFileId);
            fileInfo.handle = fileHandle;
            fileInfo.name = fileHandle.name.replace(/\.[^/.]+$/, "");
            fileInfo.content = contentToSave;
            fileInfo.modified = false;
            
            this.updateTabTitle();
            console.log('File saved as:', fileHandle.name);
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error saving file:', error);
                alert('Error saving file: ' + error.message);
            }
        }
    }

    markFileAsModified() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        if (fileInfo && !fileInfo.modified) {
            fileInfo.modified = true;
            fileInfo.content = this.editor.value;
            this.updateTabTitle();
        }
    }

    updateTabTitle() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        const tab = document.querySelector(`[data-file="${this.activeFileId}"] .tab-name`);
        if (tab && fileInfo) {
            tab.textContent = fileInfo.name + (fileInfo.modified ? '*' : '');
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownReader();
});