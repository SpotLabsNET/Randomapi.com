const cookie = require('cookie');
const pad    = require('./utils').pad;
const logger = require('./utils').logger;
const syslog = require('./utils').syslog;
const redis  = require('./utils').redis;

const server = require('./app').server;
const app    = require('./app').app;

const GUI = true; // GUI - can be commented out if not required or too much overhead

const db = require('./models/db').init(() => {

  if (GUI) require('./console.js');
  require('./sockets.js');

  // Clear Redis cache on launch
  redis.keys("*", (err, lists) => {
    lists
      .filter(item => item.match(/(list\:|snippet\:)/) !== null)
      .map(list => redis.del(list));
  });

  server.listen(app.get('port'));
  server.once('error', error => {
    let bind = app.get('port');
    switch (error.code) {
      case 'EACCES':
        logger(`[server]: ${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger(`[server]: ${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  server.once('listening', () => {
    let addr = server.address();
    let bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    logger(`[server]: Listening on ${bind}`);
  });

  process.title = "RandomAPI_Server";
});
