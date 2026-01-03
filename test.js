const http = require('http');

http.get('http://localhost:5000/health', (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.error('Health check failed');
    process.exit(1);
  }
});

