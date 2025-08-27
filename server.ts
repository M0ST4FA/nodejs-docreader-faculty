import app from './app';
import RoleModel from './models/Role';
import GracefulShutdown from './utils/GracefulShutdown';
import LogController from './controllers/LogController';

const port = process.env.PORT || 3001;

const server = app.listen(port, async () => {
  console.log(`[Server]: HTTP server is running at http://localhost:${port}`);

  await RoleModel.refreshPermissionCache();
  LogController.initializeFlushTimer();
});

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
