import * as dom from './dom.js';
import { state } from './state.js';
import { setupMarked } from './utils.js';
import { render, renderPreview, closeSidebarMobile } from './ui.js';
import { load, newFile, scheduleSave } from './file-system.js';
import { importFile, exportFile } from './import-export.js';

// --- Initial Setup ---

function setView(mode){
  ['viewSplit','viewEdit','viewPreview'].forEach(id=>dom.$('#'+id).classList.remove('on'));
  if (mode === 'split'){ dom.viewSplit.classList.add('on'); dom.editorPane.style.display='block'; dom.previewPane.style.display='block'; dom.editorPane.style.flex='1'; dom.previewPane.style.flex='1'; }
  if (mode === 'edit'){ dom.viewEdit.classList.add('on'); dom.editorPane.style.display='block'; dom.previewPane.style.display='none'; dom.editorPane.style.flex='1'; }
  if (mode === 'preview'){ dom.viewPreview.classList.add('on'); dom.editorPane.style.display='none'; dom.previewPane.style.display='block'; dom.previewPane.style.flex='1'; }
}

function initialize() {
  // --- Global Event Listeners ---
  window.addEventListener('beforeunload', (e) => {
    if (state.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // --- UI Event Listeners ---
  dom.titleInput.addEventListener('input', scheduleSave);
  dom.searchInput.addEventListener('input', render);
  dom.mdInput.addEventListener('input', ()=>{ renderPreview(); scheduleSave(); });

  dom.newBtn.addEventListener('click', ()=>newFile());
  dom.welcomeNew.addEventListener('click', ()=>newFile());

  dom.uploadBtn.addEventListener('click', ()=>dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e)=>{
    const list = Array.from(e.target.files || []);
    list.forEach(file=> importFile(file));
    e.target.value = '';
  });

  dom.downloadBtn.addEventListener('click', exportFile);

  dom.themeToggle.addEventListener('click', ()=>{
    const cur = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    const isDark = cur === 'light'; // If current is light, new will be dark
    dom.themeToggle.textContent = isDark ? 'Dark' : 'Light';
    dom.hljsLightTheme.disabled = isDark;
    dom.hljsDarkTheme.disabled = !isDark;
  });

  dom.viewSplit.addEventListener('click', ()=>setView('split'));
  dom.viewEdit.addEventListener('click', ()=>setView('edit'));
  dom.viewPreview.addEventListener('click', ()=>setView('preview'));

  dom.sidebarToggle.addEventListener('click', ()=>{ dom.sidebar.classList.add('open'); dom.scrim.classList.add('show'); });
  dom.scrim.addEventListener('click', closeSidebarMobile);

  // --- Load data and setup ---
  load();
  setupMarked();
}

initialize();