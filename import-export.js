import { state, MAX_FILE_SIZE_MB } from './state.js';
import { bareName, extOf, uid } from './utils.js';
import { showToast, render } from './ui.js';
import { newFile, openFile, persist } from './file-system.js';

async function handleText(file) {
  const text = await file.text();
  newFile(bareName(file.name), text);
}

async function handleDocx(file) {
  if (!window.mammoth || !window.TurndownService) {
    showToast('Converter for .docx is not available.', 'error');
    return;
  }
  const placeholderId = newPending(file.name, 'Converting .docx…');
  try {
    const buf = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buf });
    const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const markdown = turndown.turndown(result.value || '');
    resolvePending(placeholderId, bareName(file.name), markdown);
  } catch (err) {
    handleImportError(err, file.name, placeholderId);
  }
}

async function handlePdf(file) {
  if (!window.pdfjsLib) {
    showToast('Converter for .pdf is not available.', 'error');
    return;
  }
  const placeholderId = newPending(file.name, 'Converting .pdf…');
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const numPages = pdf.numPages;
    let out = [];
    for (let p = 1; p <= numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const lines = {};
      content.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        (lines[y] = lines[y] || []).push(item.str);
      });
      const pageText = Object.keys(lines).sort((a, b) => b - a).map(y => lines[y].join(' ')).join('\n');
      out.push(pageText.trim());
    }
    const markdown = out.filter(Boolean).join('\n\n---\n\n');
    resolvePending(placeholderId, bareName(file.name), markdown || '_No extractable text found in this PDF._');
  } catch (err) {
    handleImportError(err, file.name, placeholderId);
  }
}

const fileHandlers = {
  'md': handleText,
  'markdown': handleText,
  'txt': handleText,
  'docx': handleDocx,
  'pdf': handlePdf,
};

export async function importFile(file){
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    showToast(`File "${file.name}" is too large (max ${MAX_FILE_SIZE_MB}MB).`, 'warning');
    return;
  }

  const ext = extOf(file.name);
  const handler = fileHandlers[ext];

  if (handler) {
    await handler(file);
  } else {
    showToast(`File type ".${ext}" is not supported.`, 'warning');
  }
}

function handleImportError(err, fileName, placeholderId) {
  console.error('Import failed', err);
  let message = `Couldn't convert "${fileName}".`;
  if (err.name === 'PasswordException') {
    message = `Could not open "${fileName}". It seems to be password-protected.`;
  }
  showToast(message, 'error', 5000);
  if (placeholderId) {
    state.files = state.files.filter(f => f.id !== placeholderId);
    render();
  }
}

function newPending(originalName, label){
  const f = { id: uid(), name: `${bareName(originalName)} — ${label}`, content:'', updatedAt: Date.now(), pending:true };
  state.files.push(f);
  render();
  return f.id;
}

function resolvePending(id, finalName, markdown){
  const f = state.files.find(x=>x.id===id);
  if (!f) return;
  f.name = finalName;
  f.content = markdown;
  f.pending = false;
  f.updatedAt = Date.now();
  persist();
  openFile(id);
}

export function exportFile() {
  const f = state.activeFile;
  if (!f){ alert('Open a note first to export it.'); return; }
  const blob = new Blob([f.content], {type:'text/markdown'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (f.name || 'untitled') + '.md';
  a.click();
  URL.revokeObjectURL(url);
}