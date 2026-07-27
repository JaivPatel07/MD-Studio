import * as dom from './dom.js';
import { state } from './state.js';
import { setupMarked } from './utils.js';
import { render, renderPreview, closeSidebarMobile, showToast } from './ui.js';
import { initializeTheme } from './theme.js';

// --- Initial Setup ---

function setView(mode){
  ['viewSplit','viewEdit','viewPreview'].forEach(id=>dom.$('#'+id).classList.remove('on'));
  if (mode === 'split'){ dom.viewSplit.classList.add('on'); dom.editorPane.style.display='block'; dom.previewPane.style.display='block'; dom.editorPane.style.flex='1'; dom.previewPane.style.flex='1'; }
  if (mode === 'edit'){ dom.viewEdit.classList.add('on'); dom.editorPane.style.display='block'; dom.previewPane.style.display='none'; dom.editorPane.style.flex='1'; }
  if (mode === 'preview'){ dom.viewPreview.classList.add('on'); dom.editorPane.style.display='none'; dom.previewPane.style.display='block'; dom.previewPane.style.flex='1'; }
}

async function initialize() {
  // --- Global Event Listeners ---
  const { scheduleSave, newFile, load, persist } = await import('./file-system.js');

  window.addEventListener('beforeunload', (e) => {
    if (state.isDirty) {
      // Synchronously save any pending changes before the page unloads.
      const f = state.activeFile;
      if (f) {
        f.name = dom.titleInput.value.trim() || 'Untitled';
        f.content = dom.mdInput.value;
        f.updatedAt = Date.now();
        persist(); // This is a synchronous operation
      }
    }
  });

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const isVisible = dom.findReplaceBar.style.display === 'flex';
      dom.findReplaceBar.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        dom.findInput.focus();
      }
    }
  });

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

  initializeTheme();

  dom.viewSplit.addEventListener('click', ()=>setView('split'));
  dom.viewEdit.addEventListener('click', ()=>setView('edit'));
  dom.viewPreview.addEventListener('click', ()=>setView('preview'));

  if (dom.sidebarToggle) {
    dom.sidebarToggle.addEventListener('click', ()=>{ dom.sidebar.classList.add('open'); dom.scrim.classList.add('show'); });
  }
  dom.scrim.addEventListener('click', closeSidebarMobile);

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
    const regex = new RegExp(query, 'gi');
    findMatches = [...text.matchAll(regex)];
    dom.findMatches.textContent = `0/${findMatches.length}`;
    if (findMatches.length > 0) {
      currentMatchIndex = -1;
      findNext();
    }
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
      findInEditor(); // Re-run find to update matches
    }
  };

  const replaceAll = () => {
    const query = dom.findInput.value;
    if (!query) return;
    const replacement = dom.replaceInput.value;
    const regex = new RegExp(query, 'gi');
    dom.mdInput.value = dom.mdInput.value.replace(regex, replacement);
    renderPreview();
    scheduleSave();
    findInEditor(); // Re-run find to clear matches
  };

  dom.findInput.addEventListener('input', findInEditor);
  dom.findInput.addEventListener('keydown', e => { if (e.key === 'Enter') findNext(); });
  dom.replaceBtn.addEventListener('click', replace);
  dom.replaceAllBtn.addEventListener('click', replaceAll);
  dom.closeFindBtn.addEventListener('click', () => { dom.findReplaceBar.style.display = 'none'; });

  // --- Load data and setup ---
  load();
  setupMarked();
}

initialize();