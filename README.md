# MD-Studio

A simple, private, and powerful Markdown editor that lives in your browser. Write, convert, and manage notes from `.md`, `.docx`, and `.pdf` files with ease. All your data stays on your device.

**[Live Demo URL]** https://md-studio-bdfwuc7js-jaivpatel07s-projects.vercel.app/

!MD Studio Screenshot
*Replace the placeholder above with a screenshot of your application.*

---

## ✨ Features
*   **Live Markdown Preview**: See your rendered document update in real-time as you type.
*   **GitHub Flavored Markdown**: Write documentation, READMEs, and notes with GFM support.
*   **Export to Markdown & PDF**: Download your work as `.md` files or export to PDF.
*   **Import & Convert**: Automatically convert and edit `.md`, `.txt`, `.docx`, and `.pdf` files.
*   **Syntax Highlighting**: Code blocks are automatically highlighted for readability.
*   **Local-First Storage**: All data is saved in your browser for complete privacy. Nothing is sent to a server.
*   **Dark & Light Themes**: Switch between themes for your preferred writing environment.
*   **Full-Text Search**: Instantly find notes by title or content.
*   **Autosave**: Your work is saved automatically, so you never lose changes.
*   **Word & Character Count**: Keep track of your document's length with note statistics.
*   **PWA Ready**: Install the app on your desktop or mobile device for an app-like experience.
*   **Markdown Viewer**: Quickly open and view Markdown files from your computer.

## 🛠️ Tech Stack

*   **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3
*   **Bundler**: `esbuild`
*   **Markdown Parsing**: `marked.js`
*   **Syntax Highlighting**: `highlight.js`
*   **File Conversion**:
    *   `.docx` to HTML: `mammoth.js`
    *   `.pdf` to Text: `pdf.js`
    *   HTML to Markdown: `turndown.js`
*   **Deployment**: GitHub Pages with GitHub Actions

## 🚀 Getting Started for Development

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/<your-username>/<your-repository-name>.git
    cd <your-repository-name>
    ```

2.  **Install dependencies:**
    This project uses `npm` to manage development dependencies (like `esbuild`).
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This command will start `esbuild` in watch mode, automatically rebuilding `dist/bundle.js` when you save a file in the `src` directory.
    ```bash
    npm run dev
    ```

4.  **Open `index.html` in your browser** to see the application running.

### Building for Production

To create a minified, production-ready bundle, run:
```bash
npm run build
```

```
MD-Studio
├─ build.js
├─ bundle.js
├─ deploy.yml
├─ dom.js
├─ file-system.js
├─ import-export.js
├─ index.html
├─ main.js
├─ manifest.json
├─ markdown-notes.html
├─ package-lock.json
├─ package.json
├─ README.md
├─ script.js
├─ state.js
├─ style.css
├─ ui.js
└─ utils.js

```