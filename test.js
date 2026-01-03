const http = require('http');

function checkHealth(retries = 10) {
  http.get('http://localhost:5000/health', (res) => {
    if (res.statusCode === 200) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      retry();
    }
  }).on('error', retry);

  function retry() {
    if (retries === 0) {
      console.error('Service not ready');
      process.exit(1);
    }
    setTimeout(() => checkHealth(retries - 1), 1000);
  }
}

checkHealth();

