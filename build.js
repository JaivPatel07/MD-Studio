const fs = require('fs-extra');
const { execSync } = require('child_process');

const distFolder = 'dist';
const baseUrl = 'https://your-username.github.io/your-repository-name'; // TODO: Replace with your actual domain

const filesToCopy = [
  'index.html',
  'style.css',
  'manifest.json',
  'README.md',
  'robots.txt',
  'favicon.svg',
  "googlea38b15686fc50c6a.html",
  'markdown-to-pdf.html',
  'markdown-cheatsheet.html',
];

async function build() {
  try {
    console.log('Cleaning old dist folder...');
    await fs.emptyDir(distFolder);

    console.log('Running esbuild...');
    execSync('esbuild main.js --bundle --splitting --format=esm --outdir=dist --minify --tree-shaking=true --target=es2022', {
      stdio: 'inherit',
    });

    console.log('Copying static assets...');

    for (const file of filesToCopy) {
      console.log(`Copying ${file}...`);
      await fs.copy(file, `${distFolder}/${file}`);
      console.log(`✓ ${file}`);
    }

    await generateSitemap();

    console.log('Build successful!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  const staticPages = filesToCopy.filter(file => file.endsWith('.html'));

  const urls = staticPages.map(page => {
    const pageName = page === 'index.html' ? '' : page;
    const priority = page === 'index.html' ? '1.0' : '0.8';
    return `
  <url>
    <loc>${baseUrl}/${pageName}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`;
  await fs.writeFile(`${distFolder}/sitemap.xml`, sitemapContent);
  console.log('✓ sitemap.xml');
}

build();