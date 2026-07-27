import * as dom from './dom.js';
import { state } from './state.js';
import { setupMarked } from './utils.js';
import { render, renderPreview, closeSidebarMobile, showToast } from './ui.js';

// --- Initial Setup ---

function setView(mode){
  ['viewSplit','viewEdit','viewPreview'].forEach(id=>dom.$('#'+id).classList.remove('on'));
  if (mode === 'split'){ dom.viewSplit.classList.add('on'); dom.editorPane.style.display='block'; dom.previewPane.style.display='block'; dom.editorPane.style.flex='1'; dom.previewPane.style.flex='1'; }
  if (mode === 'edit'){ dom.viewEdit.classList.add('on'); dom.editorPane.style.display='block'; dom.previewPane.style.display='none'; dom.editorPane.style.flex='1'; }
  if (mode === 'preview'){ dom.viewPreview.classList.add('on'); dom.editorPane.style.display='none'; dom.previewPane.style.display='block'; dom.previewPane.style.flex='1'; }
}

async function initialize() {
  // --- Global Event Listeners ---
  window.addEventListener('beforeunload', (e) => {
    if (state.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  const { scheduleSave, newFile, load } = await import('./file-system.js');

  // --- UI Event Listeners ---
  dom.titleInput.addEventListener('input', scheduleSave);
  dom.searchInput.addEventListener('input', render);
  dom.mdInput.addEventListener('input', ()=>{ renderPreview(); scheduleSave(); });

  const handleNewFile = () => {
    import('./file-system.js').then(({ newFile }) => newFile());
  };
  dom.newBtn.addEventListener('click', handleNewFile);
  dom.welcomeNew.addEventListener('click', handleNewFile);

  dom.uploadBtn.addEventListener('click', ()=>dom.fileInput.click());
  dom.fileInput.addEventListener('change', async (e)=>{
    const list = Array.from(e.target.files || []);
    if (list.length > 0) {
      try {
        const { importFile } = await import('./import-export.js');
        list.forEach(file => importFile(file));
      } catch (err) {
        console.error("Failed to load import module", err);
        showToast('Error loading import functionality.', 'error');
      }
    }
    e.target.value = '';
  });

  dom.downloadBtn.addEventListener('click', async () => {
    try {
      const { exportFile } = await import('./import-export.js');
      exportFile();
    } catch (err) {
      console.error("Failed to load export module", err);
      showToast('Error loading export functionality.', 'error');
    }
  });

  dom.themeToggle.addEventListener('click', ()=>{
    const cur = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    dom.hljsLightTheme.disabled = isDark;
    dom.hljsDarkTheme.disabled = !isDark;
    dom.$('#themeIconLight').style.display = isDark ? 'none' : 'block';
    dom.$('#themeIconDark').style.display = isDark ? 'block' : 'none';
  });

  dom.viewSplit.addEventListener('click', ()=>setView('split'));
  dom.viewEdit.addEventListener('click', ()=>setView('edit'));
  dom.viewPreview.addEventListener('click', ()=>setView('preview'));

  if (dom.sidebarToggle) {
    dom.sidebarToggle.addEventListener('click', ()=>{ dom.sidebar.classList.add('open'); dom.scrim.classList.add('show'); });
  }
  dom.scrim.addEventListener('click', closeSidebarMobile);

  // --- Load data and setup ---
  load();
  setupMarked();
}

initialize();