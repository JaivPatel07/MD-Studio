import * as dom from './dom.js';
import { state, HUES } from './state.js';
import { escapeHtml, timeAgo, calculateStats, extractHeadings, renderMarkdownWithMath } from './utils.js';
import { openFile, deleteFile, duplicateFile, toggleStar, scheduleSave, selectFolder, deleteFolder, moveFileToFolder } from './file-system.js';

function hueFor(id){
  let sum = 0;
  for (let i=0;i<id.length;i++) sum += id.charCodeAt(i);
  return `var(${HUES[sum % HUES.length]})`;
}

export function renderFolders() {
  if (!dom.folderList) return;
  dom.folderList.innerHTML = '';

  // All Notes item
  const allBtn = document.createElement('button');
  allBtn.className = 'folder-item' + (state.activeFolderId === 'all' ? ' active' : '');
  allBtn.innerHTML = `
    <span class="folder-icon">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
    </span>
    <span class="folder-name">All Notes</span>
    <span class="folder-count">${state.files.length}</span>
  `;
  allBtn.addEventListener('click', () => {
    selectFolder('all');
  });
  dom.folderList.appendChild(allBtn);

  // User-defined Folders
  (state.folders || []).forEach(fol => {
    const count = state.files.filter(f => f.folderId === fol.id).length;
    const item = document.createElement('div');
    item.className = 'folder-item' + (state.activeFolderId === fol.id ? ' active' : '');
    const colorVar = fol.color ? `var(${fol.color})` : 'var(--blue)';
    item.style.setProperty('--folder-color', colorVar);

    item.innerHTML = `
      <span class="folder-dot" style="background: ${colorVar};"></span>
      <span class="folder-name">${escapeHtml(fol.name)}</span>
      <span class="folder-count">${count}</span>
      <div class="folder-item-actions">
        <button class="btn-fol-act btn-fol-edit" title="Edit Folder" aria-label="Edit folder">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button class="btn-fol-act btn-fol-del" title="Delete Folder" aria-label="Delete folder">✕</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-fol-act')) return;
      selectFolder(fol.id);
    });

    const editBtn = item.querySelector('.btn-fol-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openFolderModal(fol.id);
      });
    }

    const delBtn = item.querySelector('.btn-fol-del');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFolder(fol.id);
      });
    }

    dom.folderList.appendChild(item);
  });

  // Unfiled Notes item
  const unfiledCount = state.files.filter(f => !f.folderId).length;
  if (unfiledCount > 0 || (state.folders && state.folders.length > 0)) {
    const unfiledBtn = document.createElement('button');
    unfiledBtn.className = 'folder-item' + (state.activeFolderId === 'unfiled' ? ' active' : '');
    unfiledBtn.innerHTML = `
      <span class="folder-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      </span>
      <span class="folder-name">Unfiled</span>
      <span class="folder-count">${unfiledCount}</span>
    `;
    unfiledBtn.addEventListener('click', () => {
      selectFolder('unfiled');
    });
    dom.folderList.appendChild(unfiledBtn);
  }
}

export function updateActiveNoteFolderUI() {
  const f = state.activeFile;
  if (!dom.noteFolderLabel || !dom.noteFolderBtn) return;
  
  if (!f) {
    dom.noteFolderLabel.textContent = 'Unfiled';
    if (dom.noteFolderBtn) dom.noteFolderBtn.style.setProperty('--btn-fol-color', 'var(--text-secondary)');
    return;
  }

  const folder = state.folders.find(fol => fol.id === f.folderId);
  if (folder) {
    dom.noteFolderLabel.textContent = folder.name;
    const colorVar = folder.color ? `var(${folder.color})` : 'var(--blue)';
    dom.noteFolderBtn.style.setProperty('--btn-fol-color', colorVar);
  } else {
    dom.noteFolderLabel.textContent = 'Unfiled';
    dom.noteFolderBtn.style.setProperty('--btn-fol-color', 'var(--text-secondary)');
  }
}

export function populateNoteFolderMenu() {
  if (!dom.noteFolderMenu) return;
  const f = state.activeFile;
  if (!f) return;

  dom.noteFolderMenu.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'dropdown-header';
  header.textContent = 'Move note to folder';
  dom.noteFolderMenu.appendChild(header);

  // Unfiled Option
  const unfiledOpt = document.createElement('button');
  unfiledOpt.className = 'dropdown-item' + (!f.folderId ? ' active-opt' : '');
  unfiledOpt.innerHTML = `
    <span class="fol-opt-icon">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
    </span>
    <span>Unfiled (No folder)</span>
    ${!f.folderId ? '<span class="opt-check">✓</span>' : ''}
  `;
  unfiledOpt.addEventListener('click', () => {
    moveFileToFolder(f.id, null);
    dom.noteFolderMenu.style.display = 'none';
  });
  dom.noteFolderMenu.appendChild(unfiledOpt);

  const divider = document.createElement('div');
  divider.className = 'dropdown-divider';
  dom.noteFolderMenu.appendChild(divider);

  // Folders list
  state.folders.forEach(fol => {
    const isCurrent = f.folderId === fol.id;
    const opt = document.createElement('button');
    opt.className = 'dropdown-item' + (isCurrent ? ' active-opt' : '');
    const colorVar = fol.color ? `var(${fol.color})` : 'var(--blue)';
    opt.innerHTML = `
      <span class="folder-dot" style="background: ${colorVar}; margin-right: 6px;"></span>
      <span>${escapeHtml(fol.name)}</span>
      ${isCurrent ? '<span class="opt-check">✓</span>' : ''}
    `;
    opt.addEventListener('click', () => {
      moveFileToFolder(f.id, fol.id);
      dom.noteFolderMenu.style.display = 'none';
    });
    dom.noteFolderMenu.appendChild(opt);
  });

  const divider2 = document.createElement('div');
  divider2.className = 'dropdown-divider';
  dom.noteFolderMenu.appendChild(divider2);

  const newFolBtn = document.createElement('button');
  newFolBtn.className = 'dropdown-item dropdown-item-action';
  newFolBtn.innerHTML = `
    <span style="font-weight: bold; margin-right: 6px;">+</span>
    <span>Create New Folder…</span>
  `;
  newFolBtn.addEventListener('click', () => {
    dom.noteFolderMenu.style.display = 'none';
    openFolderModal();
  });
  dom.noteFolderMenu.appendChild(newFolBtn);
}

export function openFolderModal(folderIdToEdit = null) {
  state.editingFolderId = folderIdToEdit;
  if (!dom.folderModal) return;

  const colorButtons = dom.folderColorOptions ? dom.folderColorOptions.querySelectorAll('.color-opt-btn') : [];

  if (folderIdToEdit) {
    const fol = state.folders.find(f => f.id === folderIdToEdit);
    if (!fol) return;
    if (dom.folderModalTitle) dom.folderModalTitle.textContent = 'Rename Folder';
    if (dom.folderNameInput) dom.folderNameInput.value = fol.name;
    
    colorButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-color') === (fol.color || '--blue'));
    });
  } else {
    if (dom.folderModalTitle) dom.folderModalTitle.textContent = 'New Folder';
    if (dom.folderNameInput) dom.folderNameInput.value = '';
    
    colorButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === 0);
    });
  }

  dom.folderModal.style.display = 'flex';
  setTimeout(() => {
    if (dom.folderNameInput) {
      dom.folderNameInput.focus();
      dom.folderNameInput.select();
    }
  }, 50);
}

export function closeFolderModal() {
  if (dom.folderModal) dom.folderModal.style.display = 'none';
  state.editingFolderId = null;
}

export function render() {
  renderFolders();
  updateActiveNoteFolderUI();

  const searchTerm = (dom.searchInput.value || '').toLowerCase().trim();
  
  let list = state.files.slice();

  // Filter by Active Folder
  if (state.activeFolderId === 'unfiled') {
    list = list.filter(f => !f.folderId);
  } else if (state.activeFolderId !== 'all') {
    list = list.filter(f => f.folderId === state.activeFolderId);
  }

  if (state.starredOnly) {
    list = list.filter(f => f.starred);
  }

  if (searchTerm) {
    list = list.filter(f =>
      (f.name || '').toLowerCase().includes(searchTerm) ||
      (f.content || '').toLowerCase().includes(searchTerm)
    );
  }

  // Sort list
  if (state.sortOrder === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (state.sortOrder === 'size') {
    list.sort((a, b) => (b.content || '').length - (a.content || '').length);
  } else {
    // Default 'updated'
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  const activeFolderName = state.activeFolder ? ` in ${state.activeFolder.name}` : (state.activeFolderId === 'unfiled' ? ' in Unfiled' : '');
  dom.fileCount.textContent = list.length ? `${list.length} note${list.length > 1 ? 's' : ''}${activeFolderName}` : '0 notes';

  if (!list.length) {
    if (state.starredOnly) {
      dom.fileList.innerHTML = '<div class="empty-list">No starred notes found.<br>Click the ★ star icon on any note to bookmark it.</div>';
    } else if (state.files.length > 0 && searchTerm) {
      dom.fileList.innerHTML = '<div class="empty-list">No notes match your search query.</div>';
    } else if (state.activeFolderId !== 'all' && state.activeFolderId !== 'unfiled') {
      const fol = state.folders.find(f => f.id === state.activeFolderId);
      dom.fileList.innerHTML = `<div class="empty-list">No notes in "${escapeHtml(fol ? fol.name : 'this folder')}".<br>Create a note here or move notes into this folder.</div>`;
    } else {
      dom.fileList.innerHTML = '<div class="empty-list">No documents yet.<br>Click "New" or choose a template to begin.</div>';
    }
    return;
  }

  dom.fileList.innerHTML = '';
  list.forEach(f => {
    const card = document.createElement('div');
    card.className = 'card' + (f.id === state.activeId ? ' active' : '') + (f.pending ? ' pending' : '') + (f.starred ? ' starred' : '');
    card.style.setProperty('--dot', hueFor(f.id));
    const d = new Date(f.updatedAt || Date.now());
    const stats = calculateStats(f.content || '');

    // Folder badge info
    const folderObj = state.folders.find(fol => fol.id === f.folderId);
    const folderTagHtml = folderObj 
      ? `<span class="cfolder-tag" style="--fol-color: var(${folderObj.color || '--blue'})">${escapeHtml(folderObj.name)}</span>` 
      : '';

    card.innerHTML = `
      <div class="card-actions">
        <button class="cstar ${f.starred ? 'active' : ''}" title="${f.starred ? 'Unstar' : 'Star'}" aria-label="Star note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="${f.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </button>
        <button class="cdup" title="Duplicate" aria-label="Duplicate note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="cdel" title="Delete" aria-label="Delete note">✕</button>
      </div>
      <div class="crow">
        <span class="cdot"></span>
        <span class="cname">${escapeHtml(f.name || 'Untitled')}</span>
      </div>
      <div class="cmeta">
        ${folderTagHtml}
        <span>${f.pending ? 'converting…' : d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + ' · ' + stats.words + ' words'}</span>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.cstar') || e.target.closest('.cdup') || e.target.closest('.cdel') || f.pending) return;
      openFile(f.id);
      closeSidebarMobile();
    });

    const starBtn = card.querySelector('.cstar');
    if (starBtn) {
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStar(f.id);
      });
    }

    const dupBtn = card.querySelector('.cdup');
    if (dupBtn) {
      dupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        duplicateFile(f.id);
      });
    }

    const delBtn = card.querySelector('.cdel');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(f.id);
      });
    }

    dom.fileList.appendChild(card);
  });
}

export function renderPreview(){
  try{
    dom.previewOut.innerHTML = renderMarkdownWithMath(dom.mdInput.value || '');
  }catch(e){
    console.error('Preview error', e);
    dom.previewOut.innerHTML = '<p>' + escapeHtml(dom.mdInput.value || '') + '</p>';
  }

  // Bind interactive task list checkboxes
  bindTaskCheckboxes();

  // Bind code block copy buttons
  bindCopyButtons();

  // Update Outline / TOC
  renderOutline();

  updateNoteStats();
}

function bindTaskCheckboxes() {
  const checkboxes = dom.previewOut.querySelectorAll('input.task-checkbox');
  checkboxes.forEach((cb, index) => {
    cb.addEventListener('change', () => {
      const text = dom.mdInput.value;
      const taskPattern = /^(-|\*|\+)\s+\[([ xX])\]/gm;
      let match;
      let currentIndex = 0;
      let replaced = false;

      const newText = text.replace(taskPattern, (fullMatch, bullet, stateChar) => {
        if (currentIndex === index && !replaced) {
          replaced = true;
          currentIndex++;
          return `${bullet} [${cb.checked ? 'x' : ' '}]`;
        }
        currentIndex++;
        return fullMatch;
      });

      if (replaced) {
        dom.mdInput.value = newText;
        scheduleSave();
      }
    });
  });
}

function bindCopyButtons() {
  const copyButtons = dom.previewOut.querySelectorAll('.btn-copy-code');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-code') || '';
      try {
        await navigator.clipboard.writeText(code);
        const span = btn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          span.textContent = originalText;
          btn.classList.remove('copied');
        }, 1800);
      } catch(err) {
        showToast('Failed to copy code', 'error');
      }
    });
  });
}

export function renderOutline() {
  if (!dom.outlineList) return;
  const headings = extractHeadings(dom.mdInput.value || '');
  
  if (!headings.length) {
    dom.outlineList.innerHTML = '<div class="outline-empty">No headings found (#, ##, ###)</div>';
    return;
  }

  dom.outlineList.innerHTML = '';
  headings.forEach(h => {
    const item = document.createElement('div');
    item.className = `outline-item outline-level-${h.level}`;
    item.textContent = h.text;
    item.title = h.text;
    item.addEventListener('click', () => {
      // Scroll in editor
      const lines = dom.mdInput.value.split('\n');
      let charPos = 0;
      for (let i = 0; i < h.lineNumber && i < lines.length; i++) {
        charPos += lines[i].length + 1;
      }
      dom.mdInput.focus();
      dom.mdInput.setSelectionRange(charPos, charPos);
      
      const lineRatio = h.lineNumber / Math.max(1, lines.length);
      dom.editorPane.scrollTop = lineRatio * (dom.editorPane.scrollHeight - dom.editorPane.clientHeight);
      dom.previewPane.scrollTop = lineRatio * (dom.previewPane.scrollHeight - dom.previewPane.clientHeight);
    });
    dom.outlineList.appendChild(item);
  });
}

export function updateNoteStats() {
  const f = state.activeFile;
  if (!f) {
    dom.noteStats.textContent = '';
    return;
  }
  const text = dom.mdInput.value || '';
  const stats = calculateStats(text);
  const lastUpdated = timeAgo(f.updatedAt);
  
  // Calculate cursor line and column
  const pos = dom.mdInput.selectionStart || 0;
  const linesBefore = text.slice(0, pos).split('\n');
  const lineNum = linesBefore.length;
  const colNum = linesBefore[linesBefore.length - 1].length + 1;

  dom.noteStats.innerHTML = `
    <span class="stat-item">${stats.words} words</span>
    <span class="stat-sep">·</span>
    <span class="stat-item">${stats.chars} chars</span>
    <span class="stat-sep">·</span>
    <span class="stat-item">~${stats.readingTimeMinutes}m read</span>
    <span class="stat-sep">·</span>
    <span class="stat-item cursor-pos">Ln ${lineNum}, Col ${colNum}</span>
    <span class="stat-sep">·</span>
    <span class="stat-item">Saved ${lastUpdated}</span>
  `;
}

export function setSaveState(kind){
  const labels = { saved:'saved', saving:'saving…', error:'not saved' };
  dom.saveState.textContent = labels[kind] || kind;
  dom.saveState.classList.remove('is-saved','is-saving','is-error');
  dom.saveState.classList.add('is-' + kind);
}

export function showToast(message, type = 'info', duration = 3200) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">${escapeHtml(message)}</div>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `;
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => toast.remove());

  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

export function closeSidebarMobile(){
  if (window.innerWidth <= 780){ dom.sidebar.classList.remove('open'); dom.scrim.classList.remove('show'); }
}
