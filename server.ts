import https from 'node:https';
import fs from 'node:fs';

import app from './app';

import RoleModel from './models/Role';
import GracefulShutdown from './utils/GracefulShutdown';
import LogController from './controllers/LogController';

const port = process.env.PORT || 8080;
const usesTLS = process.env.TLS_ENABLED === 'True';

let server;

if (!usesTLS)
  server = app.listen(port, async () => {
    console.log(`[Server]: HTTP server is running at http://localhost:${port}`);

    await RoleModel.refreshPermissionCache();
    LogController.initializeFlushTimer();
  });
else {
  const options = {
    key: fs.readFileSync(process.env.TLS_KEY_PATH!),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH!),
  };

  server = https.createServer(options, app);

  server.listen(port, async () => {
    console.log(
      `[Server]: HTTPS server is running at http://localhost:${port}`,
    );

    await RoleModel.refreshPermissionCache();
    LogController.initializeFlushTimer();
  });
}

process.on('SIGTERM', GracefulShutdown.handler.bind(GracefulShutdown, server));
process.on('SIGINT', GracefulShutdown.handler.bind(GracefulShutdown, server));
process.on(
  'uncaughtException',
  GracefulShutdown.handler.bind(GracefulShutdown, server),
);
process.on(
  'unhandledRejection',
  GracefulShutdown.handler.bind(GracefulShutdown, server),
);
