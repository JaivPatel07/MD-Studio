const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}
app.use(express.static(__dirname));

// Express 5 compatible catch-all handler
app.use((req, res) => {
  const reqPath = req.path;
  
  // Try direct file match in dist
  const distFile = path.join(distDir, reqPath);
  if (fs.existsSync(distFile) && fs.statSync(distFile).isFile()) {
    return res.sendFile(distFile);
  }
  
  // Try direct file match in root
  const rootFile = path.join(__dirname, reqPath);
  if (fs.existsSync(rootFile) && fs.statSync(rootFile).isFile()) {
    return res.sendFile(rootFile);
  }

  // Try appending .html (e.g. /markdown-cheatsheet -> /markdown-cheatsheet.html)
  if (!path.extname(reqPath)) {
    const htmlDistFile = path.join(distDir, `${reqPath}.html`);
    if (fs.existsSync(htmlDistFile) && fs.statSync(htmlDistFile).isFile()) {
      return res.sendFile(htmlDistFile);
    }
    const htmlRootFile = path.join(__dirname, `${reqPath}.html`);
    if (fs.existsSync(htmlRootFile) && fs.statSync(htmlRootFile).isFile()) {
      return res.sendFile(htmlRootFile);
    }
  }
  
  // Fallback to index.html
  const distIndex = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MD Studio server running at http://0.0.0.0:${PORT}`);
});

