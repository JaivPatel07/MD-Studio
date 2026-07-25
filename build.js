const fs = require('fs-extra');
const { execSync } = require('child_process');

const distFolder = 'dist';

// List of files and folders to copy to the dist folder
const filesToCopy = [
  'index.html',
  'style.css',
  'manifest.json',
  'README.md' // Good to have in the deployment
];

async function build() {
  try {
    console.log('Cleaning old dist folder...');
    await fs.emptyDir(distFolder);

    console.log('Running esbuild...');
    execSync('esbuild main.js --bundle --minify --outfile=dist/bundle.js', { stdio: 'inherit' });

    console.log('Copying static assets...');
    await Promise.all(filesToCopy.map(file => fs.copy(file, `${distFolder}/${file}`)));

    console.log('Build successful!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();