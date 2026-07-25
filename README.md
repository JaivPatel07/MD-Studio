# MD-Studio

A simple, private, and powerful Markdown editor that lives in your browser. Write, convert, and manage notes from `.md`, `.docx`, and `.pdf` files with ease. All your data stays on your device.

**[[Live Demo URL]](https://md-studio-bdfwuc7js-jaivpatel07s-projects.vercel.app/)**https://md-studio-bdfwuc7js-jaivpatel07s-projects.vercel.app/

!MD Studio Screenshot
*Replace the placeholder above with a screenshot of your application.*

---

## ✨ Features

*   **Rich Markdown Editor**: Write in Markdown with a live preview panel.
*   **Dual Themes**: Switch between a clean light theme and a focused dark theme.
*   **Flexible Layouts**: Choose between split-screen, editor-only, or preview-only views.
*   **Powerful Importer**: Import and automatically convert `.md`, `.txt`, `.docx`, and `.pdf` files to Markdown.
*   **Export to Markdown**: Easily download your notes as standard `.md` files.
*   **Privacy First**: All your notes are stored directly in your browser's local storage. Nothing is ever sent to a server.
*   **Full-Text Search**: Instantly search through the titles and content of all your notes.
*   **Code Syntax Highlighting**: Code blocks in the preview are automatically highlighted.
*   **Note Statistics**: See your word count and when the note was last saved.
*   **PWA Ready**: Installable on desktop and mobile for a native-app-like experience.
*   **Deploy-Friendly**: Simple, static file structure ready for easy hosting.

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
