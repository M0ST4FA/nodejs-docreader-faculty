import app from './app';

import RoleModel from './models/Role';

const port = process.env.PORT || 3001;

app.listen(port, async () => {
  console.log(`[server]: HTTP server is running at http://localhost:${port}`);

  await RoleModel.refreshPermissionCache();
});
