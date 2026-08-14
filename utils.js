export const uid = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

export function escapeHtml(s){
  return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

export function timeAgo(timestamp) {
  if (!timestamp) return 'never';
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
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " secs ago";
}

export function extOf(name){
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export const bareName = name => (name || 'Untitled').replace(/\.[a-z0-9]+$/i, '');

export function calculateStats(text) {
  if (!text) {
    return { words: 0, chars: 0, charsNoSpaces: 0, lines: 1, paragraphs: 0, readingTimeMinutes: 1 };
  }
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const lines = text.split('\n').length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  return { words, chars, charsNoSpaces, lines, paragraphs, readingTimeMinutes };
}

export function extractHeadings(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const headings = [];
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim();
      const text = rawText.replace(/[*_`~[\]]/g, '').trim();
      const id = 'heading-' + index + '-' + text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ id, level, text, rawText, lineNumber: index });
    }
  });

  return headings;
}

export function renderMarkdownWithMath(markdown) {
  if (!markdown) return '';
  let content = markdown;

  // Process math placeholders if KaTeX is available
  const mathBlocks = [];
  const mathInlines = [];

  if (window.katex) {
    // Replace block math $$...$$
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      const index = mathBlocks.length;
      try {
        const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        mathBlocks.push(`<div class="katex-block">${rendered}</div>`);
      } catch (e) {
        mathBlocks.push(`<pre class="katex-error">$$\n${escapeHtml(math)}\n$$</pre>`);
      }
      return `%%MATH_BLOCK_${index}%%`;
    });

    // Replace inline math $...$
    content = content.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
      const index = mathInlines.length;
      try {
        const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        mathInlines.push(rendered);
      } catch (e) {
        mathInlines.push(`$${escapeHtml(math)}$`);
      }
      return `%%MATH_INLINE_${index}%%`;
    });
  }

  let html = '';
  if (window.marked) {
    html = marked.parse(content);
  } else {
    html = '<p>' + escapeHtml(content) + '</p>';
  }

  // Restore Math
  mathBlocks.forEach((block, idx) => {
    html = html.replace(`%%MATH_BLOCK_${idx}%%`, block);
    html = html.replace(`<p>%%MATH_BLOCK_${idx}%%</p>`, block);
  });
  mathInlines.forEach((inline, idx) => {
    html = html.replace(`%%MATH_INLINE_${idx}%%`, inline);
  });

  return html;
}

export function setupMarked() {
  if (!window.marked) return;

  const renderer = new marked.Renderer();

  // Custom code renderer with language label and copy button
  renderer.code = function(code, lang) {
    const validLang = (lang && hljs.getLanguage(lang)) ? lang : '';
    const highlighted = validLang 
      ? hljs.highlight(code, { language: validLang }).value 
      : (window.hljs ? hljs.highlightAuto(code).value : escapeHtml(code));

    const langDisplay = validLang ? `<span class="code-lang">${validLang}</span>` : '';
    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          ${langDisplay}
          <button type="button" class="btn-copy-code" data-code="${escapeHtml(code)}" title="Copy code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
        </div>
        <pre><code class="hljs ${validLang}">${highlighted}</code></pre>
      </div>`;
  };

  // Custom checkbox / list item support for interactive task lists
  renderer.listitem = function(text, task, checked) {
    if (task) {
      return `<li class="task-list-item"><input type="checkbox" class="task-checkbox" ${checked ? 'checked' : ''} /> ${text}</li>\n`;
    }
    return `<li>${text}</li>\n`;
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false
  });
}

// Formatting helpers for the Markdown Toolbar
export function applyFormatting(textarea, formatType) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);

  let replacement = '';
  let cursorOffset = 0;
  let newStart = start;
  let newEnd = end;

  switch(formatType) {
    case 'bold':
      replacement = `**${selectedText || 'bold text'}**`;
      cursorOffset = selectedText ? replacement.length : 2;
      break;
    case 'italic':
      replacement = `*${selectedText || 'italic text'}*`;
      cursorOffset = selectedText ? replacement.length : 1;
      break;
    case 'strike':
      replacement = `~~${selectedText || 'strikethrough text'}~~`;
      cursorOffset = selectedText ? replacement.length : 2;
      break;
    case 'h1':
      replacement = `\n# ${selectedText || 'Heading 1'}\n`;
      cursorOffset = replacement.length - 1;
      break;
    case 'h2':
      replacement = `\n## ${selectedText || 'Heading 2'}\n`;
      cursorOffset = replacement.length - 1;
      break;
    case 'h3':
      replacement = `\n### ${selectedText || 'Heading 3'}\n`;
      cursorOffset = replacement.length - 1;
      break;
    case 'code':
      if (selectedText.includes('\n')) {
        replacement = `\n\`\`\`javascript\n${selectedText || '// code here'}\n\`\`\`\n`;
        cursorOffset = replacement.length - 5;
      } else {
        replacement = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? replacement.length : 1;
      }
      break;
    case 'quote':
      if (selectedText) {
        replacement = selectedText.split('\n').map(l => `> ${l}`).join('\n');
      } else {
        replacement = `\n> Blockquote\n`;
      }
      cursorOffset = replacement.length;
      break;
    case 'ul':
      if (selectedText) {
        replacement = selectedText.split('\n').map(l => `- ${l}`).join('\n');
      } else {
        replacement = `\n- List item\n- List item\n`;
      }
      cursorOffset = replacement.length;
      break;
    case 'ol':
      if (selectedText) {
        replacement = selectedText.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
      } else {
        replacement = `\n1. First item\n2. Second item\n`;
      }
      cursorOffset = replacement.length;
      break;
    case 'task':
      if (selectedText) {
        replacement = selectedText.split('\n').map(l => `- [ ] ${l}`).join('\n');
      } else {
        replacement = `\n- [ ] Task 1\n- [ ] Task 2\n`;
      }
      cursorOffset = replacement.length;
      break;
    case 'table':
      replacement = `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Item A | Value 1 | $10.00 |\n| Item B | Value 2 | $25.00 |\n`;
      cursorOffset = replacement.length;
      break;
    case 'hr':
      replacement = `\n---\n`;
      cursorOffset = replacement.length;
      break;
    case 'link':
      replacement = `[${selectedText || 'link text'}](https://example.com)`;
      cursorOffset = selectedText ? replacement.length - 1 : 1;
      break;
    case 'image':
      replacement = `![${selectedText || 'Image description'}](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800)`;
      cursorOffset = replacement.length;
      break;
    case 'math':
      replacement = `$$\nf(x) = \\int_{-\\infty}^\\infty e^{-x^2} dx\n$$`;
      cursorOffset = replacement.length;
      break;
    default:
      return;
  }

  textarea.focus();
  textarea.setRangeText(replacement, start, end, 'end');
  textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
}
