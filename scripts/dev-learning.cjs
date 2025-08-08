/**
 * Development script for Learning Platform (Port 3001)
 * Simulates learning.educourse.com.au locally
 */

const { spawn } = require('child_process');
const { join } = require('path');

const projectRoot = join(__dirname, '..');

console.log('🎓 Starting Learning Platform Development Server...');
console.log('📍 This simulates: learning.educourse.com.au');
console.log('🌐 Access at: http://localhost:3001');

// Set environment variables for learning platform
process.env.VITE_APP_MODE = 'learning';
process.env.VITE_SUBDOMAIN = 'learning';

// Start Vite dev server on port 3001
const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', '3001'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_APP_MODE: 'learning',
    VITE_SUBDOMAIN: 'learning'
  }
});

viteProcess.on('close', (code) => {
  console.log(`Learning platform dev server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down learning platform dev server...');
  viteProcess.kill();
  process.exit(0);
});