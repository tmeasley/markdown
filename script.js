class MarkdownReader {
    constructor() {
        this.currentFile = null;
        this.isEditMode = false;
        this.fileHandle = null;
        this.directoryHandle = null;
        this.directoryPath = null; // For Electron: store directory path
        this.openFiles = new Map();
        this.activeFileId = 'untitled.md';
        this.autoSaveTimeout = null;
        this.isAutoSaving = false;
        this.isElectron = window.electronAPI?.isElectron || false;
        this.hasShownMarkdownFallbackWarning = false;

        this.initializeElements();
        this.attachEventListeners();
        this.initializeElectronListeners();
        this.initializeEditor();
        this.loadThemePreference();
        this.loadFontPreference();
    }

    scheduleAutoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Schedule auto-save for 2 seconds after user stops typing
        this.autoSaveTimeout = setTimeout(() => {
            this.performAutoSave();
        }, 2000);
    }

    async performAutoSave() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        if (!fileInfo || !fileInfo.modified || this.isAutoSaving) {
            return; // Don't auto-save new files, unmodified files, or if already saving
        }

        // Check if file has a path (Electron) or handle (browser)
        if (this.isElectron && !fileInfo.path) return;
        if (!this.isElectron && !fileInfo.handle) return;

        this.isAutoSaving = true;
        this.showAutoSaveStatus('Saving...');

        try {
            // Get current content
            const contentToSave = this.isEditMode ? this.htmlToMarkdown(this.editor.innerHTML) : fileInfo.content;

            // Save to file
            if (this.isElectron) {
                await window.electronAPI.writeFile(fileInfo.path, contentToSave);
            } else {
                const writable = await fileInfo.handle.createWritable();
                await writable.write(contentToSave);
                await writable.close();
            }

            // Update file info
            fileInfo.content = contentToSave;
            fileInfo.modified = false;
            this.updateTabTitle();

            this.showAutoSaveStatus('Saved', 2000);
            console.log('Auto-saved:', fileInfo.name);

        } catch (error) {
            console.error('Auto-save failed:', error);
            this.showAutoSaveStatus('Save failed', 3000);
        }

        this.isAutoSaving = false;
    }

    showAutoSaveStatus(message, duration = 0) {
        // Update save button to show status
        const saveBtn = this.saveBtn;
        const originalHTML = saveBtn.innerHTML;
        const originalTitle = saveBtn.title;

        saveBtn.innerHTML = `<i class="fas fa-circle" style="font-size: 6px; margin-right: 4px; color: ${message === 'Saved' ? '#059669' : message === 'Save failed' ? '#dc2626' : '#f59e0b'}"></i><span style="font-size: 10px;">${message}</span>`;
        saveBtn.title = message;

        if (duration > 0) {
            setTimeout(() => {
                saveBtn.innerHTML = originalHTML;
                saveBtn.title = originalTitle;
            }, duration);
        }
    }

    initializeElements() {
        this.editor = document.getElementById('markdownEditor');
        this.preview = document.getElementById('markdownPreview');
        this.previewPane = document.getElementById('previewPane');
        this.editorPane = document.getElementById('editorPane');
        this.fileTree = document.getElementById('fileTree');
        this.tabContainer = document.getElementById('tabContainer');
        this.editToggle = document.getElementById('editToggle');
        this.toolbarToggle = document.getElementById('toolbarToggle');
        this.saveBtn = document.getElementById('saveBtn');
        this.newFileBtn = document.getElementById('newFileBtn');
        this.openFolderBtn = document.getElementById('openFolderBtn');
        this.editorContainer = document.querySelector('.editor-container');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarResizer = document.getElementById('sidebarResizer');
        this.themeSelector = document.getElementById('themeSelector');
        this.fontSelector = document.getElementById('fontSelector');
    }

    initializeElectronListeners() {
        console.log('[MarkdownReader] Electron mode:', this.isElectron);
        if (!this.isElectron) return;

        // Listen for menu events from Electron
        window.electronAPI.onMenuNewFile(() => {
            console.log('[MarkdownReader] IPC menu: new file');
            this.newFile();
        });
        window.electronAPI.onMenuOpenFolder(() => {
            console.log('[MarkdownReader] IPC menu: open folder');
            this.openFolder();
        });
        window.electronAPI.onMenuSaveFile(() => {
            console.log('[MarkdownReader] IPC menu: save file');
            this.saveFile();
        });
        window.electronAPI.onMenuSaveAsFile(() => {
            console.log('[MarkdownReader] IPC menu: save as');
            this.saveAsFile();
        });
        window.electronAPI.onMenuCloseFile(() => {
            console.log('[MarkdownReader] IPC menu: close file');
            this.closeFile();
        });
        window.electronAPI.onMenuToggleEdit(() => {
            console.log('[MarkdownReader] IPC menu: toggle edit');
            this.toggleEditMode();
        });
    }

    attachEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => {
            // Update file content in real-time when editing
            const fileInfo = this.openFiles.get(this.activeFileId);
            if (fileInfo && this.isEditMode) {
                fileInfo.content = this.htmlToMarkdown(this.editor.innerHTML);
                fileInfo.modified = true;
                this.updateTabTitle();
            }
            this.scheduleAutoSave();
        });

        // Update toolbar state when cursor moves
        this.editor.addEventListener('keyup', () => {
            if (this.isEditMode) this.updateToolbarState();
        });
        this.editor.addEventListener('mouseup', () => {
            if (this.isEditMode) this.updateToolbarState();
        });

        // Toolbar events
        const toolbar = document.getElementById('formattingToolbar');
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                if (e.target.closest('.toolbar-btn')) {
                    const btn = e.target.closest('.toolbar-btn');
                    const format = btn.dataset.format;
                    this.applyFormat(format);
                }
            });
        }

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
        this.toolbarToggle.addEventListener('click', () => this.toggleToolbar());
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
            content: '# Prose\n\n*A clean markdown reader and editor*\n\nWelcome to **Prose**, a focused space for writing and reading without clutter. Pair the editor and preview panes to stay in flow, switch themes to suit the moment, and let auto-save keep every thought safe.\n\n## Quick Start\n\n1. **Open Folder** to browse your markdown library\n2. Toggle **Edit** (`Ctrl+E`) when you want to write\n3. Tap **Ctrl+S** to save or let Prose auto-save for you\n\n## Highlights\n\n- Elegant typography and soft themes for long-form reading\n- Tabs for juggling multiple drafts\n- File-tree navigation for entire folders\n- Offline-friendly markdown rendering\n\nHappy writing!\n',
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
            this.preview.innerHTML = this.renderMarkdown(fileInfo.content);
        }
    }


    renderMarkdown(content) {
        const text = typeof content === 'string' ? content : '';

        if (window.marked?.parse) {
            return window.marked.parse(text);
        }

        if (!this.hasShownMarkdownFallbackWarning) {
            console.warn('Marked library not available. Using basic renderer instead.');
            this.hasShownMarkdownFallbackWarning = true;
        }

        return this.basicMarkdownRenderer(text);
    }

    basicMarkdownRenderer(markdownText = '') {
        const escapeHtml = (str = '') => str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const escapeAttribute = (str = '') => escapeHtml(str).replace(/"/g, '&quot;');

        const formatInline = (text = '') => {
            const codePlaceholders = [];
            let escaped = escapeHtml(text);

            escaped = escaped.replace(/`([^`]+)`/g, (_, code) => {
                const token = `__CODE_PLACEHOLDER_${codePlaceholders.length}__`;
                codePlaceholders.push(`<code>${escapeHtml(code)}</code>`);
                return token;
            });

            escaped = escaped.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_, alt, url, title) => {
                const titleAttr = title ? ` title="${escapeAttribute(title)}"` : '';
                return `<img src="${escapeAttribute(url)}" alt="${escapeHtml(alt)}"${titleAttr} />`;
            });

            escaped = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_, label, url, title) => {
                const titleAttr = title ? ` title="${escapeAttribute(title)}"` : '';
                return `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${label}</a>`;
            });

            escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            escaped = escaped.replace(/__(.+?)__/g, '<strong>$1</strong>');
            escaped = escaped.replace(/~~(.+?)~~/g, '<del>$1</del>');
            escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
            escaped = escaped.replace(/_(.+?)_/g, '<em>$1</em>');

            codePlaceholders.forEach((value, index) => {
                escaped = escaped.replace(`__CODE_PLACEHOLDER_${index}__`, value);
            });

            return escaped;
        };

        const normalized = markdownText.replace(/\r\n/g, '\n');
        const lines = normalized.split('\n');
        const html = [];

        let inUl = false;
        let inOl = false;
        let inCodeBlock = false;
        let inBlockquote = false;
        let codeLang = '';
        let codeBuffer = [];
        let blockquoteBuffer = [];
        let paragraphBuffer = [];

        const closeLists = () => {
            if (inUl) {
                html.push('</ul>');
                inUl = false;
            }
            if (inOl) {
                html.push('</ol>');
                inOl = false;
            }
        };

        const flushParagraph = () => {
            if (!paragraphBuffer.length) return;
            const joined = paragraphBuffer.join('\n').trim();
            if (joined) {
                let paragraphHtml = formatInline(joined);
                paragraphHtml = paragraphHtml.replace(/\n/g, '<br />');
                html.push(`<p>${paragraphHtml}</p>`);
            }
            paragraphBuffer = [];
        };

        const flushBlockquote = () => {
            if (!inBlockquote) return;
            const text = blockquoteBuffer.join('\n').trim();
            if (text) {
                let quoteHtml = formatInline(text);
                quoteHtml = quoteHtml.replace(/\n/g, '<br />');
                html.push(`<blockquote>${quoteHtml}</blockquote>`);
            }
            inBlockquote = false;
            blockquoteBuffer = [];
        };

        const flushCodeBlock = () => {
            if (!inCodeBlock) return;
            const langClass = codeLang ? ` class="language-${codeLang.toLowerCase()}"` : '';
            html.push(`<pre><code${langClass}>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
            inCodeBlock = false;
            codeLang = '';
            codeBuffer = [];
        };

        for (const originalLine of lines) {
            const trimmedLine = originalLine.trim();
            const fenceMatch = /^```(.*)$/.exec(trimmedLine);

            if (fenceMatch) {
                if (inCodeBlock) {
                    flushCodeBlock();
                } else {
                    flushParagraph();
                    flushBlockquote();
                    closeLists();
                    inCodeBlock = true;
                    codeLang = fenceMatch[1].trim();
                }
                continue;
            }

            if (inCodeBlock) {
                codeBuffer.push(originalLine);
                continue;
            }

            if (!trimmedLine) {
                flushParagraph();
                flushBlockquote();
                closeLists();
                continue;
            }

            const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmedLine);
            if (headingMatch) {
                flushParagraph();
                flushBlockquote();
                closeLists();
                const level = headingMatch[1].length;
                html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
                continue;
            }

            if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmedLine)) {
                flushParagraph();
                flushBlockquote();
                closeLists();
                html.push('<hr />');
                continue;
            }

            const blockquoteMatch = /^>\s?(.*)$/.exec(trimmedLine);
            if (blockquoteMatch) {
                flushParagraph();
                closeLists();
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteBuffer = [];
                }
                blockquoteBuffer.push(blockquoteMatch[1]);
                continue;
            } else if (inBlockquote) {
                flushBlockquote();
            }

            const ulMatch = /^[-*+]\s+(.*)$/.exec(trimmedLine);
            if (ulMatch) {
                flushParagraph();
                flushBlockquote();
                if (inOl) {
                    html.push('</ol>');
                    inOl = false;
                }
                if (!inUl) {
                    inUl = true;
                    html.push('<ul>');
                }
                html.push(`<li>${formatInline(ulMatch[1])}</li>`);
                continue;
            }

            const olMatch = /^\d+[\.\)]\s+(.*)$/.exec(trimmedLine);
            if (olMatch) {
                flushParagraph();
                flushBlockquote();
                if (inUl) {
                    html.push('</ul>');
                    inUl = false;
                }
                if (!inOl) {
                    inOl = true;
                    html.push('<ol>');
                }
                html.push(`<li>${formatInline(olMatch[1])}</li>`);
                continue;
            }

            paragraphBuffer.push(originalLine.trimEnd());
        }

        flushParagraph();
        flushBlockquote();
        closeLists();
        flushCodeBlock();

        return html.join('\n');
    }
    applyFormat(format) {
        this.editor.focus();
        
        switch (format) {
            case 'p':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'blockquote':
                this.applyBlockFormat(format);
                break;
            case 'bold':
                document.execCommand('bold', false);
                break;
            case 'italic':
                document.execCommand('italic', false);
                break;
            case 'strikethrough':
                document.execCommand('strikeThrough', false);
                break;
            case 'ul':
                document.execCommand('insertUnorderedList', false);
                break;
            case 'ol':
                document.execCommand('insertOrderedList', false);
                break;
        }
        
        // Update toolbar button states
        setTimeout(() => this.updateToolbarState(), 10);
        
        // Mark file as modified after formatting
        this.markFileAsModified();
        this.scheduleAutoSave();
    }

    applyBlockFormat(format) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        let currentElement = range.startContainer;
        
        // Find the block-level element
        while (currentElement && currentElement.nodeType !== Node.ELEMENT_NODE) {
            currentElement = currentElement.parentNode;
        }
        
        // Find the closest block element
        while (currentElement && !this.isBlockElement(currentElement)) {
            currentElement = currentElement.parentNode;
        }
        
        if (!currentElement || currentElement === this.editor) {
            // If no block element found, use formatBlock
            document.execCommand('formatBlock', false, format);
            return;
        }
        
        // Check if we're toggling the same format
        const currentTag = currentElement.tagName.toLowerCase();
        const targetTag = format.toLowerCase();
        
        if (currentTag === targetTag) {
            // Toggle off - convert to paragraph
            const newP = document.createElement('p');
            newP.innerHTML = currentElement.innerHTML;
            currentElement.parentNode.replaceChild(newP, currentElement);
            
            // Restore selection
            const newRange = document.createRange();
            newRange.selectNodeContents(newP);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            // Change to new format
            const newElement = document.createElement(targetTag);
            newElement.innerHTML = currentElement.innerHTML;
            currentElement.parentNode.replaceChild(newElement, currentElement);
            
            // Restore selection
            const newRange = document.createRange();
            newRange.selectNodeContents(newElement);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }

    isBlockElement(element) {
        const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li'];
        return blockTags.includes(element.tagName.toLowerCase());
    }

    updateToolbarState() {
        const toolbar = document.getElementById('formattingToolbar');
        if (!toolbar) return;
        
        // Reset all buttons
        toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Check current selection state and update buttons
        if (document.queryCommandState('bold')) {
            toolbar.querySelector('[data-format="bold"]')?.classList.add('active');
        }
        if (document.queryCommandState('italic')) {
            toolbar.querySelector('[data-format="italic"]')?.classList.add('active');
        }
        if (document.queryCommandState('strikeThrough')) {
            toolbar.querySelector('[data-format="strikethrough"]')?.classList.add('active');
        }
        
        // Check block format
        const formatBlock = document.queryCommandValue('formatBlock');
        if (formatBlock === 'h1') {
            toolbar.querySelector('[data-format="h1"]')?.classList.add('active');
        } else if (formatBlock === 'h2') {
            toolbar.querySelector('[data-format="h2"]')?.classList.add('active');
        } else if (formatBlock === 'h3') {
            toolbar.querySelector('[data-format="h3"]')?.classList.add('active');
        } else if (formatBlock === 'blockquote') {
            toolbar.querySelector('[data-format="blockquote"]')?.classList.add('active');
        } else if (formatBlock === 'p' || formatBlock === 'div' || !formatBlock) {
            toolbar.querySelector('[data-format="p"]')?.classList.add('active');
        }
        
        // Check lists
        if (document.queryCommandState('insertUnorderedList')) {
            toolbar.querySelector('[data-format="ul"]')?.classList.add('active');
        }
        if (document.queryCommandState('insertOrderedList')) {
            toolbar.querySelector('[data-format="ol"]')?.classList.add('active');
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

    async toggleEditMode() {
        // Auto-save before switching modes
        if (!this.isEditMode) {
            // About to enter edit mode - save current content
            await this.performAutoSave();
        }
        
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
            this.toolbarToggle.style.display = 'inline-block';
            
            // Make sure editor has current content
            const fileInfo = this.openFiles.get(this.activeFileId);
            if (fileInfo) {
                // Convert markdown to HTML for rich editing
                this.editor.innerHTML = this.renderMarkdown(fileInfo.content);
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
                
                // Auto-save when leaving edit mode
                await this.performAutoSave();
            }
            
            this.editorPane.style.display = 'none';
            this.previewPane.style.display = 'block';
            this.editorContainer.classList.remove('edit-mode');
            this.editToggle.innerHTML = '<i class="fas fa-edit"></i>';
            this.editToggle.title = 'Edit Mode';
            this.toolbarToggle.style.display = 'none';
            // Hide toolbar when leaving edit mode
            document.getElementById('formattingToolbar').style.display = 'none';
            this.updatePreview();
        }
    }

    toggleToolbar() {
        const toolbar = document.getElementById('formattingToolbar');
        const isVisible = toolbar.style.display !== 'none';
        
        if (isVisible) {
            toolbar.style.display = 'none';
            this.toolbarToggle.style.opacity = '0.6';
        } else {
            toolbar.style.display = 'flex';
            this.toolbarToggle.style.opacity = '1';
            this.updateToolbarState();
        }
    }

    async openFolder() {
        try {
            if (this.isElectron) {
                // Use Electron dialog
                console.log('[MarkdownReader] Electron openFolder dialog requested');
                const folderPath = await window.electronAPI.openFolderDialog();
                console.log('[MarkdownReader] Electron openFolder dialog result:', folderPath);
                if (folderPath) {
                    this.directoryPath = folderPath;
                    await this.loadFileTree();
                }
            } else {
                // Use browser File System Access API
                if (!('showDirectoryPicker' in window)) {
                    alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
                    return;
                }
                this.directoryHandle = await window.showDirectoryPicker();
                await this.loadFileTree();
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening folder:', error);
                alert('Error opening folder: ' + error.message);
            }
        }
    }

    async loadFileTree() {
        if (this.isElectron && !this.directoryPath) {
            console.warn('[MarkdownReader] Cannot load file tree - no directoryPath set');
            return;
        }
        if (!this.isElectron && !this.directoryHandle) return;

        // Show loading spinner
        this.fileTree.innerHTML = '<div class="no-folder"><i class="fas fa-spinner fa-spin"></i><p>Loading your library...</p></div>';

        try {
            // Create a temporary container for the content
            const tempContainer = document.createElement('div');

            if (this.isElectron) {
                console.log('[MarkdownReader] Loading directory via Electron bridge:', this.directoryPath);
                await this.renderDirectoryContentsElectron(this.directoryPath, tempContainer);
            } else {
                await this.renderDirectoryContents(this.directoryHandle, tempContainer);
            }

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

    async renderDirectoryContentsElectron(dirPath, container, level = 0) {
        if (level > 10) {
            console.log(`Stopping at level ${level} to prevent deep recursion`);
            return; // Prevent deep recursion
        }

        try {
            const entries = await window.electronAPI.readDirectory(dirPath);
            console.log(`[MarkdownReader] readDirectory(${dirPath}) returned ${entries.length} entries`);
            const fileEntries = [];
            const dirEntries = [];

            // Separate files and directories, and filter markdown files
            for (const entry of entries) {
                if (entry.isDirectory) {
                    dirEntries.push(entry);
                } else if (this.isMarkdownFile(entry.name)) {
                    fileEntries.push(entry);
                }
            }

            // Sort entries
            dirEntries.sort((a, b) => a.name.localeCompare(b.name));
            fileEntries.sort((a, b) => a.name.localeCompare(b.name));

            // Render directories first
            for (const entry of dirEntries) {
                const item = document.createElement('div');
                item.className = 'file-item folder-item';
                item.style.paddingLeft = `${16 + (level * 20)}px`;
                item.dataset.expanded = 'false';

                item.innerHTML = `<i class="fas fa-chevron-right folder-toggle"></i><i class="fas fa-folder"></i><span>${entry.name}</span>`;

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
                            await this.renderDirectoryContentsElectron(entry.path, subContainer, level + 1);
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
            }

            // Render files
            for (const entry of fileEntries) {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.style.paddingLeft = `${16 + (level * 20)}px`;
                item.style.cursor = 'pointer';

                const displayName = entry.name.replace(/\.(md|markdown)$/i, '');
                const icon = '<i class="fas fa-file-text"></i>';
                item.innerHTML = `${icon}<span>${displayName}</span>`;

                item.addEventListener('click', () => this.openFileFromTreeElectron(entry.path, entry.name));

                container.appendChild(item);
            }

        } catch (error) {
            console.error('Error reading directory via Electron:', error);
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

    async openFileFromTreeElectron(filePath, filename) {
        try {
            console.log('[MarkdownReader] Opening file via Electron:', filePath);
            const fileData = await window.electronAPI.readFile(filePath);
            console.log('[MarkdownReader] File read success:', filePath, 'size:', fileData.size);

            // Check file size (prevent opening huge files)
            if (fileData.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File is too large to open (over 10MB)');
                return;
            }

            this.addElectronFileToTabs(filePath, filename, fileData.content);

        } catch (error) {
            console.error('Error opening file via Electron:', error);
            alert('Could not open this file: ' + error.message);
        }
    }

    addElectronFileToTabs(filePath, filename, content) {
        const fileId = filePath; // Use full path as ID for Electron

        this.openFiles.set(fileId, {
            name: filename.replace(/\.(md|markdown)$/i, ""),
            content,
            modified: false,
            path: filePath
        });

        this.createTab(fileId);
        this.switchToFile(fileId);
    }

    createTab(fileId) {
        // Remove existing tab if it exists
        const existingTab = this.getTabElement(fileId);
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

    async switchToFile(fileId) {
        // Auto-save current file before switching
        await this.performAutoSave();
        
        // Update active file
        this.activeFileId = fileId;
        
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = this.getTabElement(fileId);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Load file content
        const fileInfo = this.openFiles.get(fileId);
        if (this.isEditMode) {
            // Show as rich HTML if in edit mode
            this.editor.innerHTML = this.renderMarkdown(fileInfo.content);
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
        const tab = this.getTabElement(fileId);
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
        
        // Start with a template that has a title area and content area
        const template = '# Document Title\n\nStart writing your content here...';
        
        this.openFiles.set(fileId, {
            name: 'Untitled',
            content: template,
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
            const contentToSave = this.isEditMode ? this.htmlToMarkdown(this.editor.innerHTML) : fileInfo.content;

            if (this.isElectron) {
                // Electron: check if file has a path
                if (!fileInfo.path) {
                    // New file - need to save as
                    console.warn('[MarkdownReader] Cannot save - file has no path, invoking Save As');
                    await this.saveAsFile();
                } else {
                    // Existing file - save directly
                    console.log('[MarkdownReader] Saving file via Electron:', fileInfo.path);
                    await window.electronAPI.writeFile(fileInfo.path, contentToSave);
                    fileInfo.content = contentToSave;
                    fileInfo.modified = false;
                    this.updateTabTitle();
                    console.log('File saved successfully');
                }
            } else {
                // Browser: check if file has a handle
                if (!fileInfo.handle) {
                    // New file - need to save as
                    await this.saveAsFile();
                } else {
                    // Existing file - save directly
                    const writable = await fileInfo.handle.createWritable();
                    await writable.write(contentToSave);
                    await writable.close();

                    fileInfo.content = contentToSave;
                    fileInfo.modified = false;
                    this.updateTabTitle();

                    console.log('File saved successfully');
                }
            }
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file: ' + error.message);
        }
    }

    async saveAsFile() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        if (!fileInfo) return;

        const contentToSave = this.isEditMode ? this.htmlToMarkdown(this.editor.innerHTML) : fileInfo.content;

        try {
            if (this.isElectron) {
                // Use Electron's save dialog
                const filePath = await window.electronAPI.saveFileDialog('untitled.md');

                if (filePath) {
                    await window.electronAPI.writeFile(filePath, contentToSave);

                    // Update file info
                    const fileName = filePath.split(/[\\/]/).pop(); // Get filename from path
                    const oldFileId = this.activeFileId;
                    const newFileId = filePath;

                    // Remove old entry and create new one
                    this.openFiles.delete(oldFileId);
                    this.openFiles.set(newFileId, {
                        name: fileName.replace(/\.[^/.]+$/, ""),
                        content: contentToSave,
                        modified: false,
                        path: filePath
                    });

                    // Update active file ID and tab
                    this.activeFileId = newFileId;
                    const tab = this.getTabElement(oldFileId);
                    if (tab) {
                        tab.dataset.file = newFileId;
                    }

                    this.updateTabTitle();
                    console.log('File saved as:', filePath);
                }
            } else {
                // Use browser File System Access API
                if (!('showSaveFilePicker' in window)) {
                    alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
                    return;
                }

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
                await writable.write(contentToSave);
                await writable.close();

                // Update file info
                fileInfo.handle = fileHandle;
                fileInfo.name = fileHandle.name.replace(/\.[^/.]+$/, "");
                fileInfo.content = contentToSave;
                fileInfo.modified = false;

                this.updateTabTitle();
                console.log('File saved as:', fileHandle.name);
            }

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
            // Update content based on current mode
            if (this.isEditMode) {
                fileInfo.content = this.htmlToMarkdown(this.editor.innerHTML);
            }
            this.updateTabTitle();
        }
    }

    updateTabTitle() {
        const fileInfo = this.openFiles.get(this.activeFileId);
        const tab = this.getTabElement(this.activeFileId);
        if (tab && fileInfo) {
            const nameEl = tab.querySelector('.tab-name');
            if (nameEl) {
                nameEl.textContent = fileInfo.name + (fileInfo.modified ? '*' : '');
            }
        }
    }

    getTabElement(fileId) {
        const tabs = Array.from(this.tabContainer.querySelectorAll('.tab'));
        return tabs.find(tab => tab.dataset.file === fileId) || null;
    }

    async openFileReference(reference) {
        if (!this.isElectron || !this.directoryPath || !reference) {
            console.warn('[MarkdownReader] Cannot open reference', reference);
            return;
        }

        try {
            console.log('[MarkdownReader] Opening referenced file:', reference);
            const fileData = await window.electronAPI.openFileReference(this.directoryPath, reference);
            this.addElectronFileToTabs(fileData.path, fileData.name, fileData.content);
        } catch (error) {
            console.error('Failed to open referenced file:', reference, error);
            alert(`Could not open "${reference}". Make sure the file exists in the selected folder.`);
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownReader();
});
