import * as dom from './dom.js';
import { state, STORAGE_KEY, FOLDERS_STORAGE_KEY, PREFS_KEY, DEFAULT_FOLDERS } from './state.js';
import { uid } from './utils.js';
import { render, renderPreview, updateNoteStats, setSaveState, showToast, updateActiveNoteFolderUI } from './ui.js';

export function openFile(id){
  state.activeId = id;
  const f = state.activeFile;
  if (!f) return;
  dom.welcome.style.display = 'none';
  dom.editorArea.style.display = 'flex';
  dom.titleInput.value = f.name || '';
  dom.mdInput.value = f.content || '';
  
  if (dom.starActiveBtn) {
    dom.starActiveBtn.classList.toggle('active', !!f.starred);
    dom.starActiveBtn.setAttribute('title', f.starred ? 'Unstar note' : 'Star note');
  }

  updateActiveNoteFolderUI();
  renderPreview();
  setSaveState('saved');
  state.isDirty = false;
  updateNoteStats();
  render();
}

export function newFile(name, content, folderId = null){
  // If no explicit folder passed, check active folder filter
  const targetFolderId = folderId || (state.activeFolderId !== 'all' && state.activeFolderId !== 'unfiled' ? state.activeFolderId : null);
  const f = { 
    id: uid(), 
    name: name || 'Untitled', 
    content: content || '', 
    updatedAt: Date.now(), 
    starred: false,
    folderId: targetFolderId
  };
  state.files.push(f);
  persist();
  openFile(f.id);
  showToast(`Created "${f.name}"`, 'info');
}

export function duplicateFile(id){
  const f = state.files.find(x => x.id === id);
  if (!f) return;
  const copy = {
    id: uid(),
    name: `${f.name || 'Untitled'} (Copy)`,
    content: f.content || '',
    updatedAt: Date.now(),
    starred: !!f.starred,
    folderId: f.folderId || null
  };
  state.files.push(copy);
  persist();
  openFile(copy.id);
  showToast(`Duplicated note as "${copy.name}"`, 'info');
}

export function toggleStar(id){
  const f = state.files.find(x => x.id === id);
  if (!f) return;
  f.starred = !f.starred;
  f.updatedAt = Date.now();
  persist();
  if (state.activeId === id && dom.starActiveBtn) {
    dom.starActiveBtn.classList.toggle('active', !!f.starred);
  }
  render();
}

export function deleteFile(id){
  const f = state.files.find(x=>x.id===id);
  if (!f) return;
  if (!confirm(`Delete "${f.name || 'Untitled'}"? This can't be undone.`)) return;
  state.files = state.files.filter(x=>x.id!==id);
  persist();
  if (state.activeId === id) {
    state.activeId = null;
    dom.editorArea.style.display = 'none';
    dom.welcome.style.display = 'flex';
  }
  render();
  showToast('Note deleted', 'info');
}

export function moveFileToFolder(fileId, folderId) {
  const f = state.files.find(x => x.id === fileId);
  if (!f) return;
  f.folderId = folderId || null;
  f.updatedAt = Date.now();
  persist();
  updateActiveNoteFolderUI();
  render();
  const folderObj = state.folders.find(fol => fol.id === folderId);
  showToast(folderObj ? `Moved note to "${folderObj.name}"` : 'Moved note to Unfiled', 'info');
}

// --- Folder CRUD ---
export function createFolder(name, color = '--blue') {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    showToast('Folder name cannot be empty.', 'warning');
    return null;
  }
  const folder = {
    id: 'f_' + uid(),
    name: trimmed,
    color: color || '--blue',
    createdAt: Date.now()
  };
  state.folders.push(folder);
  persistFolders();
  render();
  showToast(`Created folder "${folder.name}"`, 'info');
  return folder;
}

export function updateFolder(id, name, color) {
  const folder = state.folders.find(f => f.id === id);
  if (!folder) return;
  const trimmed = (name || '').trim();
  if (!trimmed) {
    showToast('Folder name cannot be empty.', 'warning');
    return;
  }
  folder.name = trimmed;
  if (color) folder.color = color;
  persistFolders();
  updateActiveNoteFolderUI();
  render();
  showToast(`Updated folder "${folder.name}"`, 'info');
}

export function deleteFolder(id) {
  const folder = state.folders.find(f => f.id === id);
  if (!folder) return;
  if (!confirm(`Delete folder "${folder.name}"? Notes inside will be moved to Unfiled.`)) return;
  
  // Unassign notes in this folder
  state.files.forEach(f => {
    if (f.folderId === id) {
      f.folderId = null;
    }
  });
  state.folders = state.folders.filter(f => f.id !== id);
  if (state.activeFolderId === id) {
    state.activeFolderId = 'all';
  }
  persist();
  persistFolders();
  updateActiveNoteFolderUI();
  render();
  showToast(`Deleted folder "${folder.name}"`, 'info');
}

export function selectFolder(folderId) {
  state.activeFolderId = folderId;
  persistPreferences();
  render();
}

export function scheduleSave(){
  setSaveState('saving');
  state.isDirty = true;
  clearTimeout(state.saveTimer);

  // Persist the changes immediately.
  const f = state.activeFile;
  if (f) {
    f.name = dom.titleInput.value.trim() || 'Untitled';
    f.content = dom.mdInput.value;
    f.updatedAt = Date.now();
    persist();
  }

  // Debounce less critical UI updates.
  state.saveTimer = setTimeout(()=>{
    updateNoteStats();
    render();
  }, 350);
}

export function persist(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.files));
    setSaveState('saved');
    state.isDirty = false;
  }catch(e){
    console.error('Storage error', e);
    setSaveState('error');
    showToast('Could not save notes. Storage might be full.', 'error');
  }
}

export function persistFolders(){
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(state.folders));
  } catch(e) {
    console.error('Storage error saving folders', e);
  }
}

export function persistPreferences(){
  try {
    const prefs = {
      syncScroll: state.syncScroll,
      sortOrder: state.sortOrder,
      starredOnly: state.starredOnly,
      activeFolderId: state.activeFolderId
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch(e) {}
}

export function loadPreferences(){
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const prefs = JSON.parse(raw);
      if (prefs.syncScroll !== undefined) state.syncScroll = prefs.syncScroll;
      if (prefs.sortOrder) state.sortOrder = prefs.sortOrder;
      if (prefs.starredOnly !== undefined) state.starredOnly = prefs.starredOnly;
      if (prefs.activeFolderId !== undefined) state.activeFolderId = prefs.activeFolderId;
    }
  } catch(e) {}
}

export function loadFolders(){
  try {
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (stored) {
      state.folders = JSON.parse(stored);
    } else {
      // First-time starter folders
      state.folders = JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
      persistFolders();
    }
  } catch(e) {
    state.folders = JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
  }
}

export function load(){
  loadPreferences();
  loadFolders();
  try{
    const storedFiles = localStorage.getItem(STORAGE_KEY);
    if (storedFiles) {
      state.files = JSON.parse(storedFiles);
    }
  }catch(e){
    state.files = [];
  }
  render();
}
