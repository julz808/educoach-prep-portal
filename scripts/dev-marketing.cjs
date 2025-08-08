/**
 * Development script for Marketing Site (Port 3000)
 * Simulates educourse.com.au locally
 */

const { spawn } = require('child_process');
const { join } = require('path');

const projectRoot = join(__dirname, '..');

console.log('🚀 Starting Marketing Site Development Server...');
console.log('📍 This simulates: educourse.com.au');
console.log('🌐 Access at: http://localhost:3000');

// Set environment variables for marketing site
process.env.VITE_APP_MODE = 'marketing';
process.env.VITE_SUBDOMAIN = '';

// Start Vite dev server on port 3000
const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', '3000'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_APP_MODE: 'marketing',
    VITE_SUBDOMAIN: ''
  }
});

viteProcess.on('close', (code) => {
  console.log(`Marketing site dev server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down marketing site dev server...');
  viteProcess.kill();
  process.exit(0);
});