import {
  PrismaClient,
  PermissionAction,
  PermissionScope,
  PermissionResource,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const actions = Object.values(PermissionAction);
  const scopes = Object.values(PermissionScope);
  const resources = Object.values(PermissionResource);

  const permissions = [];

  for (const action of actions) {
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
