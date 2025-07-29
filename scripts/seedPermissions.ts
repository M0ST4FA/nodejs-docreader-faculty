import {
  PrismaClient,
  PermissionAction,
  PermissionScope,
  PermissionResource,
} from '@prisma/client';

const prisma = new PrismaClient();

type Permission = {
  action: PermissionAction;
  scope: PermissionScope;
  resource: PermissionResource;
  description?: string;
};

async function main() {
  const actions = Object.values(PermissionAction);
  const scopes = Object.values(PermissionScope);
  const resources = Object.values(PermissionResource);

  const permissions: Permission[] = [];

  for (const action of actions) {
    if (action === 'ASSIGN' || action === 'SEND' || action === 'SUBSCRIBE')
      continue;

    for (const scope of scopes) {
      for (const resource of resources) {
        permissions.push({
          action,
          scope,
          resource,
          description: `${action} ${
            scope === 'OWN' ? 'own' : 'any'
          } ${resource.toLowerCase()}`,
        });
      }
    }
  }

  permissions.push({
    action: PermissionAction.ASSIGN,
    scope: PermissionScope.ANY,
    resource: PermissionResource.ROLE,
    description: 'ASSIGN any role',
  });
  permissions.push({
    action: PermissionAction.SEND,
    scope: PermissionScope.ANY,
    resource: PermissionResource.NOTIFICATION,
    description: 'SEND any notification',
  });
  permissions.push({
    action: PermissionAction.SUBSCRIBE,
    scope: PermissionScope.RESTRICTED,
    resource: PermissionResource.TOPIC,
    description: 'SUBSCRIBE restricted topic',
  });
  permissions.push({
    action: PermissionAction.SUBSCRIBE,
    scope: PermissionScope.ANY,
    resource: PermissionResource.TOPIC,
    description: 'SUBSCRIBE any topic',
  });

  console.log(`Seeding ${permissions.length} permissions...`);

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        action_scope_resource: {
          action: permission.action,
          scope: permission.scope,
          resource: permission.resource,
        },
      },
      update: {}, // nothing to update — we assume permissions are static
      create: permission,
    });
  }

  console.log(`✅ Seeded ${permissions.length} permissions successfully.`);
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
