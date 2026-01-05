const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting server...');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit'
});

// Give server time to start
setTimeout(() => {
  console.log('🔍 Running health check...');
  
  http.get('http://localhost:5000/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Response: ${data}`);
      
      if (res.statusCode === 200) {
        console.log('✅ TEST PASSED');
        server.kill('SIGTERM');
        process.exit(0);
      } else {
        console.log('❌ TEST FAILED');
        server.kill('SIGTERM');
        process.exit(1);
      }
    });
  }).on('error', () => {
    console.log('❌ Connection failed');
    server.kill('SIGTERM');
    process.exit(1);
  });
}, 2000); // Wait 2 seconds for server to start

// Cleanup on exit
process.on('exit', () => {
  server.kill('SIGTERM');
});
