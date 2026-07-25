import * as dom from './dom.js';
import { state, HUES } from './state.js';
import { escapeHtml, timeAgo } from './utils.js';
import { openFile, deleteFile } from './file-system.js';

function hueFor(id){
  let sum = 0;
  for (let i=0;i<id.length;i++) sum += id.charCodeAt(i);
  return `var(${HUES[sum % HUES.length]})`;
}

export function render() {
  const searchTerm = (dom.searchInput.value || '').toLowerCase();
  const filteredFiles = searchTerm
    ? state.files.filter(f =>
        (f.name || '').toLowerCase().includes(searchTerm) ||
        (f.content || '').toLowerCase().includes(searchTerm)
      )
    : state.files;

  dom.fileCount.textContent = filteredFiles.length ? filteredFiles.length : '';

  if (!filteredFiles.length) {
    if (state.files.length > 0 && searchTerm) {
      dom.fileList.innerHTML = '<div class="empty-list">No notes match your search.</div>';
    } else {
      dom.fileList.innerHTML = '<div class="empty-list">No notes yet.<br>Tap "New" to start writing.</div>';
    }
    return;
  }

  dom.fileList.innerHTML = '';
  filteredFiles.slice().sort((a,b)=>b.updatedAt-a.updatedAt).forEach(f=>{
    const card = document.createElement('div');
    card.className = 'card' + (f.id === state.activeId ? ' active' : '') + (f.pending ? ' pending' : '');
    card.style.setProperty('--dot', hueFor(f.id));
    const d = new Date(f.updatedAt);
    card.innerHTML = `
      <button class="cdel" aria-label="Delete note">✕</button>
      <div class="crow"><span class="cdot"></span><span class="cname">${escapeHtml(f.name || 'Untitled')}</span></div>
      <div class="cmeta">${f.pending ? 'working…' : d.toLocaleDateString(undefined,{month:'short',day:'numeric'}) + ' · ' + (f.content||'').length + ' chars'}</div>`;
    card.addEventListener('click', (e)=>{
      if (e.target.classList.contains('cdel') || f.pending) return;
      openFile(f.id);
      closeSidebarMobile();
    });
    card.querySelector('.cdel').addEventListener('click', (e)=>{
      e.stopPropagation();
      deleteFile(f.id);
    });
    dom.fileList.appendChild(card);
  });
}

export function renderPreview(){
  try{
    dom.previewOut.innerHTML = window.marked ? marked.parse(dom.mdInput.value || '') : '<p>' + escapeHtml(dom.mdInput.value) + '</p>';
  }catch(e){
    dom.previewOut.innerHTML = '<p>' + escapeHtml(dom.mdInput.value) + '</p>';
  }
  updateNoteStats();
}

export function updateNoteStats() {
  const f = state.activeFile;
  if (!f) {
    dom.noteStats.textContent = '';
    return;
  }
  const wordCount = (dom.mdInput.value || '').trim().split(/\s+/).filter(Boolean).length;
  const lastUpdated = timeAgo(f.updatedAt);
  dom.noteStats.textContent = `${wordCount} words · Last saved ${lastUpdated}`;
}

export function setSaveState(kind){
  const labels = { saved:'saved', saving:'saving…', error:'not saved' };
  dom.saveState.textContent = labels[kind] || kind;
  dom.saveState.classList.remove('is-saved','is-saving','is-error');
  dom.saveState.classList.add('is-' + kind);
}

export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}

export function closeSidebarMobile(){
  if (window.innerWidth <= 780){ dom.sidebar.classList.remove('open'); dom.scrim.classList.remove('show'); }
}