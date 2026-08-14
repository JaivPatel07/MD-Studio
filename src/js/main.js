import * as dom from './dom.js';
import { state } from './state.js';
import { setupMarked, applyFormatting } from './utils.js';
import { 
  render, 
  renderPreview, 
  closeSidebarMobile, 
  showToast, 
  updateNoteStats,
  openFolderModal,
  closeFolderModal,
  populateNoteFolderMenu
} from './ui.js';
import { initializeTheme } from './theme.js';
import { NOTE_TEMPLATES } from './templates.js';
import { 
  scheduleSave, 
  newFile, 
  load, 
  persist, 
  toggleStar, 
  persistPreferences,
  createFolder,
  updateFolder
} from './file-system.js';
import { 
  importFile, 
  exportAsMarkdown, 
  exportAsHtml, 
  printOrExportPdf, 
  exportAsTxt, 
  copyRenderedHtml, 
  copyRawMarkdown, 
  exportBackupJson, 
  importBackupJson 
} from './import-export.js';

// --- View Modes ---
function setView(mode){
  ['viewSplit','viewEdit','viewPreview'].forEach(id => {
    const el = dom.$('#' + id);
    if (el) el.classList.remove('on');
  });

  if (mode === 'split'){
    if (dom.viewSplit) dom.viewSplit.classList.add('on');
    dom.editorPane.style.display = 'flex';
    dom.previewPane.style.display = 'block';
    dom.editorPane.style.flex = '1';
    dom.previewPane.style.flex = '1';
  }
  if (mode === 'edit'){
    if (dom.viewEdit) dom.viewEdit.classList.add('on');
    dom.editorPane.style.display = 'flex';
    dom.previewPane.style.display = 'none';
    dom.editorPane.style.flex = '1';
  }
  if (mode === 'preview'){
    if (dom.viewPreview) dom.viewPreview.classList.add('on');
    dom.editorPane.style.display = 'none';
    dom.previewPane.style.display = 'block';
    dom.previewPane.style.flex = '1';
  }
}

// --- Zen Mode ---
function toggleZenMode() {
  state.zenMode = !state.zenMode;
  if (dom.app) {
    dom.app.classList.toggle('zen-mode', state.zenMode);
  }
  if (dom.zenModeBtn) {
    dom.zenModeBtn.classList.toggle('active', state.zenMode);
  }
  showToast(state.zenMode ? 'Zen mode activated (Press Esc to exit)' : 'Exited Zen mode', 'info', 2000);
}

// --- Synchronized Scrolling ---
let isScrollingEditor = false;
let isScrollingPreview = false;

function setupSyncScroll() {
  dom.editorPane.addEventListener('scroll', () => {
    if (!state.syncScroll || isScrollingEditor) return;
    isScrollingPreview = true;
    const editorScrollMax = dom.editorPane.scrollHeight - dom.editorPane.clientHeight;
    if (editorScrollMax > 0) {
      const scrollRatio = dom.editorPane.scrollTop / editorScrollMax;
      const previewScrollMax = dom.previewPane.scrollHeight - dom.previewPane.clientHeight;
      dom.previewPane.scrollTop = scrollRatio * previewScrollMax;
    }
    setTimeout(() => { isScrollingPreview = false; }, 50);
  });

  dom.previewPane.addEventListener('scroll', () => {
    if (!state.syncScroll || isScrollingPreview) return;
    isScrollingEditor = true;
    const previewScrollMax = dom.previewPane.scrollHeight - dom.previewPane.clientHeight;
    if (previewScrollMax > 0) {
      const scrollRatio = dom.previewPane.scrollTop / previewScrollMax;
      const editorScrollMax = dom.editorPane.scrollHeight - dom.editorPane.clientHeight;
      dom.editorPane.scrollTop = scrollRatio * editorScrollMax;
    }
    setTimeout(() => { isScrollingEditor = false; }, 50);
  });
}

// --- Template Modal ---
function renderTemplatesModal() {
  if (!dom.templateList) return;
  dom.templateList.innerHTML = '';
  
  NOTE_TEMPLATES.forEach(tmpl => {
    const card = document.createElement('div');
    card.className = 'template-item-card';
    card.innerHTML = `
      <div class="template-card-icon">${tmpl.icon}</div>
      <div class="template-card-info">
        <h4 class="template-card-title">${tmpl.name}</h4>
        <p class="template-card-desc">${tmpl.description}</p>
      </div>
      <button class="btn btn-sm btn-select-tmpl">Use Template</button>
    `;
    card.addEventListener('click', () => {
      newFile(tmpl.name, tmpl.content);
      closeTemplateModal();
    });
    dom.templateList.appendChild(card);
  });
}

function openTemplateModal() {
  renderTemplatesModal();
  if (dom.templateModal) dom.templateModal.style.display = 'flex';
}

function closeTemplateModal() {
  if (dom.templateModal) dom.templateModal.style.display = 'none';
}

// --- Initialize App ---
async function initialize() {
  setupMarked();

  // Load saved preferences & files
  load();

  // Setup theme
  initializeTheme();

  // Setup sync scroll
  setupSyncScroll();

  // Populate sort selector with state
  if (dom.sortSelect) {
    dom.sortSelect.value = state.sortOrder || 'updated';
    dom.sortSelect.addEventListener('change', (e) => {
      state.sortOrder = e.target.value;
      persistPreferences();
      render();
    });
  }

  // Starred filter button
  if (dom.starredFilterBtn) {
    dom.starredFilterBtn.classList.toggle('active', !!state.starredOnly);
    dom.starredFilterBtn.addEventListener('click', () => {
      state.starredOnly = !state.starredOnly;
      dom.starredFilterBtn.classList.toggle('active', state.starredOnly);
      persistPreferences();
      render();
    });
  }

  // Active note star button
  if (dom.starActiveBtn) {
    dom.starActiveBtn.addEventListener('click', () => {
      if (state.activeId) {
        toggleStar(state.activeId);
      }
    });
  }

  // Outline Toggle
  if (dom.outlineToggleBtn && dom.outlineDrawer) {
    dom.outlineToggleBtn.addEventListener('click', () => {
      state.showOutline = !state.showOutline;
      dom.outlineDrawer.style.display = state.showOutline ? 'flex' : 'none';
      dom.outlineToggleBtn.classList.toggle('active', state.showOutline);
      if (state.showOutline) renderPreview();
    });
  }
  if (dom.closeOutlineBtn && dom.outlineDrawer) {
    dom.closeOutlineBtn.addEventListener('click', () => {
      state.showOutline = false;
      dom.outlineDrawer.style.display = 'none';
      if (dom.outlineToggleBtn) dom.outlineToggleBtn.classList.remove('active');
    });
  }

  // Sync scroll toggle button
  if (dom.syncScrollBtn) {
    dom.syncScrollBtn.classList.toggle('active', state.syncScroll);
    dom.syncScrollBtn.addEventListener('click', () => {
      state.syncScroll = !state.syncScroll;
      dom.syncScrollBtn.classList.toggle('active', state.syncScroll);
      persistPreferences();
      showToast(`Synchronized scroll ${state.syncScroll ? 'enabled' : 'disabled'}`, 'info', 1500);
    });
  }

  // Zen Mode Button
  if (dom.zenModeBtn) {
    dom.zenModeBtn.addEventListener('click', toggleZenMode);
  }

  // Markdown Toolbar Formatting Buttons
  if (dom.editorToolbar) {
    dom.editorToolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.tb-btn');
      if (!btn) return;
      const format = btn.getAttribute('data-format');
      if (format && dom.mdInput) {
        applyFormatting(dom.mdInput, format);
        renderPreview();
        scheduleSave();
      }
    });
  }

  // Window unload save safety
  window.addEventListener('beforeunload', () => {
    if (state.isDirty) {
      const f = state.activeFile;
      if (f) {
        f.name = dom.titleInput.value.trim() || 'Untitled';
        f.content = dom.mdInput.value;
        f.updatedAt = Date.now();
        persist();
      }
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    // Escape key
    if (e.key === 'Escape') {
      if (state.zenMode) toggleZenMode();
      closeTemplateModal();
      closeFolderModal();
      if (dom.findReplaceBar) dom.findReplaceBar.style.display = 'none';
      if (dom.exportMenu) dom.exportMenu.style.display = 'none';
      if (dom.noteFolderMenu) dom.noteFolderMenu.style.display = 'none';
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key === 'f') {
      e.preventDefault();
      const isVisible = dom.findReplaceBar.style.display === 'flex';
      dom.findReplaceBar.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        dom.findInput.focus();
        dom.findInput.select();
      }
    } else if (mod && e.key === 's') {
      e.preventDefault();
      const f = state.activeFile;
      if (f) {
        f.name = dom.titleInput.value.trim() || 'Untitled';
        f.content = dom.mdInput.value;
        f.updatedAt = Date.now();
        persist();
        showToast('Document saved!', 'info', 1500);
      }
    } else if (mod && e.key === 'b') {
      if (document.activeElement === dom.mdInput) {
        e.preventDefault();
        applyFormatting(dom.mdInput, 'bold');
        renderPreview();
        scheduleSave();
      }
    } else if (mod && e.key === 'i') {
      if (document.activeElement === dom.mdInput) {
        e.preventDefault();
        applyFormatting(dom.mdInput, 'italic');
        renderPreview();
        scheduleSave();
      }
    } else if (mod && e.key === 'k') {
      if (document.activeElement === dom.mdInput) {
        e.preventDefault();
        applyFormatting(dom.mdInput, 'link');
        renderPreview();
        scheduleSave();
      }
    }
  });

  // Tab key indentation support in Textarea
  dom.mdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = dom.mdInput.selectionStart;
      const end = dom.mdInput.selectionEnd;
      dom.mdInput.setRangeText('  ', start, end, 'end');
      dom.mdInput.selectionStart = dom.mdInput.selectionEnd = start + 2;
      renderPreview();
      scheduleSave();
    }
  });

  // Title and Editor inputs
  dom.titleInput.addEventListener('input', scheduleSave);
  dom.mdInput.addEventListener('input', () => {
    renderPreview();
    scheduleSave();
  });
  dom.mdInput.addEventListener('keyup', updateNoteStats);
  dom.mdInput.addEventListener('click', updateNoteStats);

  // Search input & clear button
  dom.searchInput.addEventListener('input', () => {
    if (dom.clearSearchBtn) {
      dom.clearSearchBtn.style.display = dom.searchInput.value ? 'block' : 'none';
    }
    render();
  });
  if (dom.clearSearchBtn) {
    dom.clearSearchBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.clearSearchBtn.style.display = 'none';
      dom.searchInput.focus();
      render();
    });
  }

  // New Note
  dom.newBtn.addEventListener('click', () => newFile());
  dom.welcomeNew.addEventListener('click', () => newFile());

  // Template triggers
  if (dom.newTemplateBtn) dom.newTemplateBtn.addEventListener('click', openTemplateModal);
  if (dom.welcomeTemplate) dom.welcomeTemplate.addEventListener('click', openTemplateModal);
  if (dom.closeTemplateBtn) dom.closeTemplateBtn.addEventListener('click', closeTemplateModal);

  // Starter chips on welcome screen
  const starterChips = document.getElementById('starterChips');
  if (starterChips) {
    starterChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.starter-chip');
      if (!chip) return;
      const key = chip.getAttribute('data-template');
      const tmpl = NOTE_TEMPLATES.find(t => t.id === key);
      if (tmpl) {
        newFile(tmpl.name, tmpl.content);
      }
    });
  }

  // Close modal when clicking on backdrop
  if (dom.templateModal) {
    dom.templateModal.addEventListener('click', (e) => {
      if (e.target === dom.templateModal) closeTemplateModal();
    });
  }

  // --- Folder Management Handlers ---
  if (dom.newFolderBtn) {
    dom.newFolderBtn.addEventListener('click', () => {
      openFolderModal();
    });
  }

  if (dom.folderColorOptions) {
    dom.folderColorOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.color-opt-btn');
      if (!btn) return;
      dom.folderColorOptions.querySelectorAll('.color-opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  function handleSaveFolder() {
    const name = dom.folderNameInput ? dom.folderNameInput.value.trim() : '';
    if (!name) {
      showToast('Please enter a folder name.', 'warning');
      return;
    }
    const activeColorBtn = dom.folderColorOptions ? dom.folderColorOptions.querySelector('.color-opt-btn.active') : null;
    const color = activeColorBtn ? activeColorBtn.getAttribute('data-color') : '--blue';

    if (state.editingFolderId) {
      updateFolder(state.editingFolderId, name, color);
    } else {
      createFolder(name, color);
    }
    closeFolderModal();
  }

  if (dom.saveFolderBtn) {
    dom.saveFolderBtn.addEventListener('click', handleSaveFolder);
  }

  if (dom.folderNameInput) {
    dom.folderNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveFolder();
      }
    });
  }

  if (dom.cancelFolderBtn) {
    dom.cancelFolderBtn.addEventListener('click', closeFolderModal);
  }
  if (dom.closeFolderModalBtn) {
    dom.closeFolderModalBtn.addEventListener('click', closeFolderModal);
  }
  if (dom.folderModal) {
    dom.folderModal.addEventListener('click', (e) => {
      if (e.target === dom.folderModal) closeFolderModal();
    });
  }

  // Note Folder Picker Dropdown in Editor Header
  if (dom.noteFolderBtn && dom.noteFolderMenu) {
    dom.noteFolderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dom.noteFolderMenu.style.display === 'flex';
      if (isVisible) {
        dom.noteFolderMenu.style.display = 'none';
      } else {
        populateNoteFolderMenu();
        dom.noteFolderMenu.style.display = 'flex';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#noteFolderPickerWrapper')) {
        dom.noteFolderMenu.style.display = 'none';
      }
    });
  }

  // Import button
  dom.uploadBtn.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length > 0) {
      list.forEach(file => importFile(file));
    }
    e.target.value = '';
  });

  // Export Dropdown menu
  if (dom.downloadBtn && dom.exportMenu) {
    dom.downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dom.exportMenu.style.display === 'block';
      dom.exportMenu.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#exportDropdownWrapper')) {
        dom.exportMenu.style.display = 'none';
      }
    });

    // Export options
    const exportMdBtn = dom.$('#exportMdBtn');
    if (exportMdBtn) exportMdBtn.addEventListener('click', () => { exportAsMarkdown(); dom.exportMenu.style.display = 'none'; });

    const exportHtmlBtn = dom.$('#exportHtmlBtn');
    if (exportHtmlBtn) exportHtmlBtn.addEventListener('click', () => { exportAsHtml(); dom.exportMenu.style.display = 'none'; });

    const exportPdfBtn = dom.$('#exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => { printOrExportPdf(); dom.exportMenu.style.display = 'none'; });

    const exportTxtBtn = dom.$('#exportTxtBtn');
    if (exportTxtBtn) exportTxtBtn.addEventListener('click', () => { exportAsTxt(); dom.exportMenu.style.display = 'none'; });

    const copyHtmlBtn = dom.$('#copyHtmlBtn');
    if (copyHtmlBtn) copyHtmlBtn.addEventListener('click', () => { copyRenderedHtml(); dom.exportMenu.style.display = 'none'; });

    const copyMdBtn = dom.$('#copyMdBtn');
    if (copyMdBtn) copyMdBtn.addEventListener('click', () => { copyRawMarkdown(); dom.exportMenu.style.display = 'none'; });

    const exportBackupDropdownBtn = dom.$('#exportBackupDropdownBtn');
    if (exportBackupDropdownBtn) exportBackupDropdownBtn.addEventListener('click', () => { exportBackupJson(); dom.exportMenu.style.display = 'none'; });
  }

  // Backup & Restore buttons in sidebar
  if (dom.backupExportBtn) {
    dom.backupExportBtn.addEventListener('click', exportBackupJson);
  }
  if (dom.backupImportBtn && dom.backupFileInput) {
    dom.backupImportBtn.addEventListener('click', () => dom.backupFileInput.click());
    dom.backupFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        importBackupJson(file);
      }
      e.target.value = '';
    });
  }

  // View modes
  dom.viewSplit.addEventListener('click', () => setView('split'));
  dom.viewEdit.addEventListener('click', () => setView('edit'));
  dom.viewPreview.addEventListener('click', () => setView('preview'));

  // Mobile sidebar
  if (dom.sidebarToggle) {
    dom.sidebarToggle.addEventListener('click', () => {
      dom.sidebar.classList.add('open');
      dom.scrim.classList.add('show');
    });
  }
  if (dom.sidebarCloseBtn) {
    dom.sidebarCloseBtn.addEventListener('click', closeSidebarMobile);
  }
  dom.scrim.addEventListener('click', closeSidebarMobile);

  // Drag and drop importing
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      files.forEach(f => importFile(f));
    }
  });

  // --- Find & Replace Logic ---
  let findMatches = [];
  let currentMatchIndex = -1;

  const findInEditor = () => {
    const query = dom.findInput.value;
    if (!query) {
      findMatches = [];
      currentMatchIndex = -1;
      dom.findMatches.textContent = '0/0';
      return;
    }
    const text = dom.mdInput.value;
    try {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      findMatches = [...text.matchAll(regex)];
      dom.findMatches.textContent = `0/${findMatches.length}`;
      if (findMatches.length > 0) {
        currentMatchIndex = -1;
        findNext();
      }
    } catch(e) {}
  };

  const findNext = () => {
    if (!findMatches.length) return;
    currentMatchIndex = (currentMatchIndex + 1) % findMatches.length;
    const match = findMatches[currentMatchIndex];
    dom.mdInput.focus();
    dom.mdInput.setSelectionRange(match.index, match.index + match[0].length);
    dom.findMatches.textContent = `${currentMatchIndex + 1}/${findMatches.length}`;
  };

  const replace = () => {
    if (currentMatchIndex === -1 || !findMatches.length) return;
    const match = findMatches[currentMatchIndex];
    const replacement = dom.replaceInput.value;
    if (dom.mdInput.selectionStart === match.index && dom.mdInput.selectionEnd === match.index + match[0].length) {
      dom.mdInput.setRangeText(replacement, match.index, match.index + match[0].length, 'end');
      renderPreview();
      scheduleSave();
      findInEditor();
    }
  };

  const replaceAll = () => {
    const query = dom.findInput.value;
    if (!query) return;
    const replacement = dom.replaceInput.value;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    dom.mdInput.value = dom.mdInput.value.replace(regex, replacement);
    renderPreview();
    scheduleSave();
    findInEditor();
  };

  dom.findInput.addEventListener('input', findInEditor);
  dom.findInput.addEventListener('keydown', e => { if (e.key === 'Enter') findNext(); });
  dom.replaceBtn.addEventListener('click', replace);
  dom.replaceAllBtn.addEventListener('click', replaceAll);
  dom.closeFindBtn.addEventListener('click', () => { dom.findReplaceBar.style.display = 'none'; });
}

initialize();
