const http = require('http');
const { MongoClient } = require('mongodb');
const { log } = require('./logger');

const port = process.env.PORT || 5000;
const appName = process.env.APP_NAME || 'default-app';
const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';

const client = new MongoClient(mongoUrl);
let server;
let dbReady = false;

async function connectDB() {
  try {
    await client.connect();
    dbReady = true;
    log("Connected to MongoDB");
  } catch (err) {
    log("MongoDB not available — running in degraded mode");
  }
}

async function start() {
  connectDB(); // do NOT await

  server = http.createServer(async (req, res) => {
    log(`Request: ${req.method} ${req.url}`);

    if (req.url === '/health') {
      res.writeHead(200, {'Content-Type': 'application/json'});
      return res.end(JSON.stringify({ status: 'ok', db: dbReady ? 'connected' : 'unavailable' }));
    }

    if (!dbReady) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      return res.end(`Hello from ${appName}. DB offline.`);
    }

    const db = client.db('demo');
    const visits = db.collection('visits');

    await visits.insertOne({ time: new Date() });
    const count = await visits.countDocuments();

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(`Hello from ${appName}. Visits: ${count}`);
  });

  server.listen(port, () => log(`${appName} running on ${port}`));
}

async function shutdown() {
  log('Shutting down gracefully...');
  server.close(async () => {
    await client.close();
    log('Cleanup complete. Exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();