export const uid = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

export function escapeHtml(s){
  return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

export function timeAgo(timestamp) {
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

export function extOf(name){
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export const bareName = name => (name || 'Untitled').replace(/\.[a-z0-9]+$/i, '');

export function setupMarked() {
  if (!window.marked || !window.hljs) return;
  marked.setOptions({
    highlight: (code, lang) => {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  });
}