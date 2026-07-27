const fs = require('fs-extra');
const { execSync } = require('child_process');

const distFolder = 'dist';

const filesToCopy = [
  'index.html',
  'style.css',
  'manifest.json',
  'README.md',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg'
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

    console.log('Build successful!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

build();