import https from 'node:https';
import fs from 'node:fs';

import app from './app';

import RoleModel from './models/Role';

const port = process.env.PORT || 8080;
const usesTLS = process.env.TLS_ENABLED === 'True';

if (!usesTLS)
  app.listen(port, async () => {
    console.log(`[server]: HTTP server is running at http://localhost:${port}`);

    await RoleModel.refreshPermissionCache();
  });
else {
  const options = {
    key: fs.readFileSync(process.env.TLS_KEY_PATH!),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH!),
  };

  const server = https.createServer(options, app);

  server.listen(port, async () => {
    console.log(
      `[server]: HTTPS server is running at http://localhost:${port}`,
    );

    await RoleModel.refreshPermissionCache();
  });
}
