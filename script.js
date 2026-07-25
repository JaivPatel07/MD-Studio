(function(){
  const $ = s => document.querySelector(s);
  const fileList = $('#fileList'), fileCount = $('#fileCount');
  const welcome = $('#welcome'), editorArea = $('#editorArea');
  const titleInput = $('#titleInput'), mdInput = $('#mdInput'), previewOut = $('#previewOut');
  const saveState = $('#saveState');
  const sidebar = $('#sidebar'), scrim = $('#scrim');
  const editorPane = $('#editorPane'), previewPane = $('#previewPane');
  const toastContainer = $('#toastContainer');
  const noteStats = $('#noteStats');
  const searchInput = $('#searchInput');

  const hljsLightTheme = $('#hljs-light-theme');
  const hljsDarkTheme = $('#hljs-dark-theme');
  const HUES = ['--blue','--green','--yellow','--red'];

  let files = [];       // {id, name, content, updatedAt}
  let activeId = null;
  let saveTimer = null;
  let isDirty = false;
  const MAX_FILE_SIZE_MB = 10;
  const STORAGE_KEY = 'marginalia:files';

  const uid = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  function hueFor(id){
    let sum = 0;
    for (let i=0;i<id.length;i++) sum += id.charCodeAt(i);
    return `var(${HUES[sum % HUES.length]})`;
  }

  function render() {
    const searchTerm = (searchInput.value || '').toLowerCase();
    const filteredFiles = searchTerm
      ? files.filter(f =>
          (f.name || '').toLowerCase().includes(searchTerm) ||
          (f.content || '').toLowerCase().includes(searchTerm)
        )
      : files;

    fileCount.textContent = filteredFiles.length ? filteredFiles.length : '';

    if (!filteredFiles.length) {
      if (files.length > 0 && searchTerm) {
        fileList.innerHTML = '<div class="empty-list">No notes match your search.</div>';
      } else {
        fileList.innerHTML = '<div class="empty-list">No notes yet.<br>Tap "New" to start writing.</div>';
      }
      return;
    }

    fileList.innerHTML = '';
    filteredFiles.slice().sort((a,b)=>b.updatedAt-a.updatedAt).forEach(f=>{
      const card = document.createElement('div');
      card.className = 'card' + (f.id === activeId ? ' active' : '') + (f.pending ? ' pending' : '');
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
      fileList.appendChild(card);
    });
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function openFile(id){
    activeId = id;
    const f = files.find(x=>x.id===id);
    if (!f) return;
    welcome.style.display = 'none';
    editorArea.style.display = 'flex';
    titleInput.value = f.name;
    mdInput.value = f.content;
    renderPreview();
    setSaveState('saved');
    isDirty = false;
    updateNoteStats();
    render();
  }

  function renderPreview(){
    try{
      previewOut.innerHTML = window.marked ? marked.parse(mdInput.value || '') : '<p>' + escapeHtml(mdInput.value) + '</p>';
    }catch(e){
      previewOut.innerHTML = '<p>' + escapeHtml(mdInput.value) + '</p>';
    }
    updateNoteStats();
  }

  function updateNoteStats() {
    const f = files.find(x => x.id === activeId);
    if (!f) {
      noteStats.textContent = '';
      return;
    }
    const wordCount = (mdInput.value || '').trim().split(/\s+/).filter(Boolean).length;
    const lastUpdated = timeAgo(f.updatedAt);
    noteStats.textContent = `${wordCount} words · Last saved ${lastUpdated}`;
  }

  function timeAgo(timestamp) {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  function setupMarked() {
    if (!window.marked || !window.hljs) return;
    marked.setOptions({
      highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
    });
  }

  function newFile(name, content){
    const f = { id: uid(), name: name || 'Untitled', content: content || '', updatedAt: Date.now() };
    files.push(f);
    persist();
    openFile(f.id);
  }

  function deleteFile(id){
    const f = files.find(x=>x.id===id);
    if (!f) return;
    if (!confirm(`Delete "${f.name || 'Untitled'}"? This can't be undone.`)) return;
    files = files.filter(x=>x.id!==id);
    persist();
    if (activeId === id) {
      activeId = null;
      editorArea.style.display = 'none';
      welcome.style.display = 'flex';
    }
    render();
  }

  function setSaveState(kind){
    const labels = { saved:'saved', saving:'saving…', error:'not saved' };
    saveState.textContent = labels[kind] || kind;
    saveState.classList.remove('is-saved','is-saving','is-error');
    saveState.classList.add('is-' + kind);
  }

  function scheduleSave(){
    setSaveState('saving');
    isDirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async ()=>{
      const f = files.find(x=>x.id===activeId);
      if (f){
        f.name = titleInput.value.trim() || 'Untitled';
        f.content = mdInput.value;
        f.updatedAt = Date.now();
        await persist();
        updateNoteStats();
        render();
      }
    }, 400);
  }

  async function persist(){
    try{
      await window.storage.set(STORAGE_KEY, JSON.stringify(files), false);
      setSaveState('saved');
      isDirty = false;
    }catch(e){
      console.error('Storage error', e);
      setSaveState('error');
    }
  }

  async function load(){
    try{
      const res = await window.storage.get(STORAGE_KEY, false);
      files = res && res.value ? JSON.parse(res.value) : [];
    }catch(e){
      files = [];
    }
    render();
  }

  // ---- Notifications ----
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, duration);
  }


  // ---- events ----
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  titleInput.addEventListener('input', scheduleSave);
  searchInput.addEventListener('input', render);
  mdInput.addEventListener('input', ()=>{ renderPreview(); scheduleSave(); });

  $('#newBtn').addEventListener('click', ()=>newFile());
  $('#welcomeNew').addEventListener('click', ()=>newFile());

  $('#uploadBtn').addEventListener('click', ()=>$('#fileInput').click());
  $('#fileInput').addEventListener('change', (e)=>{
    const list = Array.from(e.target.files || []);
    list.forEach(file=> importFile(file));
    e.target.value = '';
  });

  function extOf(name){
    const m = /\.([a-z0-9]+)$/i.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }
  const bareName = name => (name || 'Untitled').replace(/\.[a-z0-9]+$/i, '');

  // --- File Import Handlers ---

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

  async function importFile(file){
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
    // Remove the pending card on failure
    if (placeholderId) {
      files = files.filter(f => f.id !== placeholderId);
      render();
    }
  }

  // Shows a temporary "converting…" card while a docx/pdf is processed, then fills it in.
  function newPending(originalName, label){
    const f = { id: uid(), name: `${bareName(originalName)} — ${label}`, content:'', updatedAt: Date.now(), pending:true };
    files.push(f);
    render();
    return f.id;
  }
  function resolvePending(id, finalName, markdown){
    const f = files.find(x=>x.id===id);
    if (!f) return;
    f.name = finalName;
    f.content = markdown;
    f.pending = false;
    f.updatedAt = Date.now();
    persist();
    openFile(id);
  }

  $('#downloadBtn').addEventListener('click', ()=>{
    const f = files.find(x=>x.id===activeId);
    if (!f){ alert('Open a note first to export it.'); return; }
    const blob = new Blob([f.content], {type:'text/markdown'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (f.name || 'untitled') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  });

  $('#themeToggle').addEventListener('click', ()=>{
    const cur = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    const isDark = cur === 'light';
    $('#themeToggle').textContent = isDark ? '◑' : '◐';
    hljsLightTheme.disabled = isDark;
    hljsDarkTheme.disabled = !isDark;
  });

  function setView(mode){
    ['viewSplit','viewEdit','viewPreview'].forEach(id=>$('#'+id).classList.remove('on'));
    if (mode === 'split'){ $('#viewSplit').classList.add('on'); editorPane.style.display='block'; previewPane.style.display='block'; editorPane.style.flex='1'; previewPane.style.flex='1'; }
    if (mode === 'edit'){ $('#viewEdit').classList.add('on'); editorPane.style.display='block'; previewPane.style.display='none'; editorPane.style.flex='1'; }
    if (mode === 'preview'){ $('#viewPreview').classList.add('on'); editorPane.style.display='none'; previewPane.style.display='block'; previewPane.style.flex='1'; }
  }
  $('#viewSplit').addEventListener('click', ()=>setView('split'));
  $('#viewEdit').addEventListener('click', ()=>setView('edit'));
  $('#viewPreview').addEventListener('click', ()=>setView('preview'));

  $('#sidebarToggle').addEventListener('click', ()=>{
    sidebar.classList.add('open'); scrim.classList.add('show');
  });
  function closeSidebarMobile(){
    if (window.innerWidth <= 780){ sidebar.classList.remove('open'); scrim.classList.remove('show'); }
  }
  scrim.addEventListener('click', ()=>{ sidebar.classList.remove('open'); scrim.classList.remove('show'); });

  load();
  setupMarked();
})();