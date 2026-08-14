import { state, MAX_FILE_SIZE_MB } from './state.js';
import { bareName, extOf, uid } from './utils.js';
import { showToast, render } from './ui.js';
import { newFile, openFile, persist, persistFolders } from './file-system.js';

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
  exportAsMarkdown();
}

export function exportAsMarkdown() {
  const f = state.activeFile;
  if (!f){ showToast('Open a note first to export it.', 'warning'); return; }
  const blob = new Blob([f.content || ''], {type:'text/markdown;charset=utf-8'});
  downloadBlob(blob, (f.name || 'untitled') + '.md');
  showToast('Exported as Markdown (.md)', 'info');
}

export function exportAsTxt() {
  const f = state.activeFile;
  if (!f){ showToast('Open a note first to export it.', 'warning'); return; }
  const blob = new Blob([f.content || ''], {type:'text/plain;charset=utf-8'});
  downloadBlob(blob, (f.name || 'untitled') + '.txt');
  showToast('Exported as Plain Text (.txt)', 'info');
}

export function exportAsHtml() {
  const f = state.activeFile;
  if (!f){ showToast('Open a note first to export it.', 'warning'); return; }
  
  const parsedHtml = window.marked ? marked.parse(f.content || '') : `<p>${escapeHtml(f.content || '')}</p>`;
  const pageTitle = escapeHtml(f.name || 'Untitled Note');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pageTitle}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<style>
  :root {
    --serif: 'Iowan Old Style', 'Palatino Linotype', Georgia, serif;
    --mono: 'IBM Plex Mono', Menlo, Consolas, monospace;
    --text: #191714;
    --bg: #FBFAF7;
    --accent: #2A55E5;
    --border: #E7E2D6;
    --code-bg: #F5EFEB;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --text: #F3F0EA;
      --bg: #151412;
      --accent: #5C86FF;
      --border: #33302A;
      --code-bg: #22201C;
    }
  }
  body {
    max-width: 760px;
    margin: 40px auto;
    padding: 0 24px 60px;
    font-family: var(--serif);
    font-size: 16px;
    line-height: 1.75;
    color: var(--text);
    background: var(--bg);
  }
  h1, h2, h3, h4, h5, h6 { font-weight: 800; line-height: 1.3; margin: 1.4em 0 0.5em; }
  h1 { font-size: 2.2em; border-bottom: 2px solid var(--text); padding-bottom: 0.3em; }
  h2 { font-size: 1.6em; }
  h3 { font-size: 1.3em; }
  p, ul, ol { margin: 0.9em 0; }
  ul, ol { padding-left: 1.6em; }
  li { margin-bottom: 0.3em; }
  blockquote {
    border-left: 4px solid var(--accent);
    margin: 1.2em 0;
    padding: 0.5em 16px;
    background: rgba(42, 85, 229, 0.06);
  }
  code {
    font-family: var(--mono);
    font-size: 0.9em;
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 4px;
  }
  pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 1.2em 0;
  }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1.2em 0; }
  th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
  th { background: var(--code-bg); font-weight: 700; }
  a { color: var(--accent); }
  img { max-width: 100%; border-radius: 6px; }
  hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
  .task-list-item { list-style: none; margin-left: -1.2em; }
</style>
</head>
<body>
${parsedHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], {type:'text/html;charset=utf-8'});
  downloadBlob(blob, (f.name || 'untitled') + '.html');
  showToast('Exported as standalone HTML document', 'info');
}

export function printOrExportPdf() {
  const f = state.activeFile;
  if (!f){ showToast('Open a note first to print/export PDF.', 'warning'); return; }
  window.print();
}

export async function copyRenderedHtml() {
  const f = state.activeFile;
  if (!f){ showToast('Open a note first to copy HTML.', 'warning'); return; }
  const parsedHtml = window.marked ? marked.parse(f.content || '') : escapeHtml(f.content || '');
  try {
    await navigator.clipboard.writeText(parsedHtml);
    showToast('Rendered HTML copied to clipboard!', 'info');
  } catch(e) {
    showToast('Failed to copy to clipboard.', 'error');
  }
}

export async function copyRawMarkdown() {
  const f = state.activeFile;
  if (!f){ showToast('Open a note first to copy Markdown.', 'warning'); return; }
  try {
    await navigator.clipboard.writeText(f.content || '');
    showToast('Raw Markdown copied to clipboard!', 'info');
  } catch(e) {
    showToast('Failed to copy to clipboard.', 'error');
  }
}

export function exportBackupJson() {
  if (!state.files.length && !state.folders.length) {
    showToast('No notes or folders available to back up.', 'warning');
    return;
  }
  const data = {
    app: 'MD Studio',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    folders: state.folders || [],
    files: state.files || []
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json;charset=utf-8'});
  downloadBlob(blob, `md-studio-backup-${new Date().toISOString().slice(0,10)}.json`);
  showToast(`Backed up ${state.files.length} notes & ${state.folders.length} folders!`, 'info');
}

export async function importBackupJson(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid backup format.');
    }

    // Restore folders if provided
    if (data.folders && Array.isArray(data.folders)) {
      const existingFolderIds = new Set((state.folders || []).map(f => f.id));
      data.folders.forEach(fol => {
        if (fol && fol.id && !existingFolderIds.has(fol.id)) {
          state.folders.push({
            id: fol.id,
            name: fol.name || 'Untitled Folder',
            color: fol.color || '--blue',
            createdAt: fol.createdAt || Date.now()
          });
        }
      });
      persistFolders();
    }

    let addedCount = 0;
    data.files.forEach(item => {
      if (item && item.content !== undefined) {
        state.files.push({
          id: uid(),
          name: item.name || 'Restored Note',
          content: item.content || '',
          updatedAt: item.updatedAt || Date.now(),
          starred: !!item.starred,
          folderId: item.folderId || null
        });
        addedCount++;
      }
    });
    persist();
    render();
    showToast(`Restored ${addedCount} notes from backup!`, 'info');
  } catch (err) {
    console.error('Backup restore failed', err);
    showToast('Failed to parse backup JSON file.', 'error');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
