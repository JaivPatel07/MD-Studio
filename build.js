const fs = require('fs-extra');
const esbuild = require('esbuild');
const packageJson = require('./package.json');
const path = require('path');

const distFolder = 'dist';
const baseUrl = packageJson.homepage || 'https://mdstudio.app';

const filesToCopy = [
  'index.html',
  'src/css/style.css',
  'public/manifest.json',
  'README.md',
  'public/robots.txt',
  'public/favicon.svg',
  'public/googlea38b15686fc50c6a.html',
  'src/pages/markdown-to-pdf.html',
  'src/pages/markdown-cheatsheet.html',
  'src/pages/markdown-notes.html',
  'src/js/dom.js', // For static pages
  'src/js/theme.js', // For static pages
  'public/ads.txt',
];

async function build() {
  try {
    console.log('Cleaning old dist folder...');
    await fs.emptyDir(distFolder);

    console.log('Running esbuild...');
    await esbuild.build({
      entryPoints: ['src/js/main.js'],
      bundle: true,
      splitting: true,
      format: 'esm',
      outdir: `${distFolder}/src/js`,
      minify: true,
      treeShaking: true,
      target: 'es2022',
    });

    console.log('Copying static assets...');

    for (const file of filesToCopy) {
      console.log(`Copying ${file}...`);
      const dest = path.join(distFolder, file);
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(file, dest);
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
  const staticPages = filesToCopy.filter(file => file.endsWith('.html') && !file.includes('google'));

  const urls = staticPages.map(page => {
    // Determine the base route
    let pageName = '';
    if (page === 'index.html') {
      pageName = '';
    } else {
      // Just take the basename
      pageName = path.basename(page);
    }
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