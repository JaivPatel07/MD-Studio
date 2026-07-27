import * as dom from './dom.js';
import { state, STORAGE_KEY } from './state.js';
import { uid } from './utils.js';
import { render, renderPreview, updateNoteStats, setSaveState, showToast } from './ui.js';

export function openFile(id){
  state.activeId = id;
  const f = state.activeFile;
  if (!f) return;
  dom.welcome.style.display = 'none';
  dom.editorArea.style.display = 'flex';
  dom.titleInput.value = f.name;
  dom.mdInput.value = f.content;
  renderPreview();
  setSaveState('saved');
  state.isDirty = false;
  updateNoteStats();
  render();
}

export function newFile(name, content){
  const f = { id: uid(), name: name || 'Untitled', content: content || '', updatedAt: Date.now() };
  state.files.push(f);
  persist();
  openFile(f.id);
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
  }, 400);
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

export function load(){
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