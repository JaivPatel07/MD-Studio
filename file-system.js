import * as dom from './dom.js';
import { state, STORAGE_KEY } from './state.js';
import { uid } from './utils.js';
import { render, renderPreview, updateNoteStats, setSaveState } from './ui.js';

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
  state.saveTimer = setTimeout(async ()=>{
    const f = state.activeFile;
    if (f){
      f.name = dom.titleInput.value.trim() || 'Untitled';
      f.content = dom.mdInput.value;
      f.updatedAt = Date.now();
      await persist();
      updateNoteStats();
      render();
    }
  }, 400);
}

export async function persist(){
  try{
    // Using a generic storage API; assuming it's available on `window`
    await window.storage.set(STORAGE_KEY, JSON.stringify(state.files), false);
    setSaveState('saved');
    state.isDirty = false;
  }catch(e){
    console.error('Storage error', e);
    setSaveState('error');
  }
}

export async function load(){
  try{
    const res = await window.storage.get(STORAGE_KEY, false);
    state.files = res && res.value ? JSON.parse(res.value) : [];
  }catch(e){
    state.files = [];
  }
  render();
}