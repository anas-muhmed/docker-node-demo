const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port);
  });
}

// Function to kill process on port
function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'pipe' });
    }
  } catch (e) {
    // Port wasn't in use or couldn't kill, that's fine
  }
}

async function runTest() {
  const PORT = 5000;
  
  // Check if port is already in use
  if (await isPortInUse(PORT)) {
    console.log(`⚠️  Port ${PORT} is in use. Attempting to free it...`);
    killProcessOnPort(PORT);
    
    // Wait a bit and check again
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (await isPortInUse(PORT)) {
      console.error(`❌ Port ${PORT} is still in use after cleanup`);
      console.error('Please manually kill the process using:');
      console.error(`  sudo lsof -i :${PORT}`);
      console.error(`  kill -9 <PID>`);
      process.exit(1);
    }
  }

  console.log('🚀 Starting server...');

  // Start the server
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit'
  });

  // Give server time to start
  setTimeout(() => {
    console.log('🔍 Running health check...');
    
    http.get(`http://localhost:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Response: ${data}`);
        
        if (res.statusCode === 200) {
          console.log('✅ TEST PASSED');
          server.kill('SIGTERM');
          process.exit(0);
        } else {
          console.log('❌ TEST FAILED - Status code:', res.statusCode);
          server.kill('SIGTERM');
          process.exit(1);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Connection failed:', err.message);
      server.kill('SIGTERM');
      process.exit(1);
    });
  }, 2000);

  // Cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    server.kill('SIGTERM');
    process.exit(0);
  });
}

runTest();