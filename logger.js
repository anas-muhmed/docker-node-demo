function log(message) {
  const time = new Date().toISOString();
  const service = process.env.APP_NAME || 'service';
  console.log(`[${time}] [${service}] ${message}`);
}

module.exports = { log };

