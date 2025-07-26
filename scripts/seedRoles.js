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

  console.log(`Seeding default roles...`);

  // Insert the two most basic roles
  prisma.role.upsert({
    create: {
      id: 0,
      name: 'SuperAdmin',
      description: 'Top system administrator',
    },
    where: {},
  });

  prisma.role.upsert({
    create: {
      id: 1,
      name: 'User',
      description: 'Default user role',
    },
    where: {},
  });

  console.log('✅ Seeded default roles successfully.');

  // Insert permissions for user role
  console.log(`Seeding User role permissions...`);
  const userPermissions = [
    // Faculty, Year, Module, Subject, Lecture: Read-only access to academic structure
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.FACULTY,
    },
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.YEAR,
    },
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.MODULE,
    },
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.SUBJECT,
    },
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.LECTURE,
    },

    // Link: users can read all and create (e.g., sharing useful materials)
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.LINK,
    },

    // Device: users can register and manage their own devices
    {
      action: PermissionAction.CREATE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.DEVICE,
    },
    {
      action: PermissionAction.READ,
      scope: PermissionScope.OWN,
      resource: PermissionResource.DEVICE,
    },
    {
      action: PermissionAction.DELETE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.DEVICE,
    },

    // Quiz: users can read any available quizzes
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.QUIZ,
    },

    // Question: users can read questions in quizzes
    {
      action: PermissionAction.READ,
      scope: PermissionScope.ANY,
      resource: PermissionResource.QUESTION,
    },

    // Marked_Question: users can mark questions (save progress, flag)
    {
      action: PermissionAction.CREATE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.MARKED_QUESTION,
    },
    {
      action: PermissionAction.READ,
      scope: PermissionScope.OWN,
      resource: PermissionResource.MARKED_QUESTION,
    },
    {
      action: PermissionAction.UPDATE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.MARKED_QUESTION,
    },
    {
      action: PermissionAction.DELETE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.MARKED_QUESTION,
    },

    // User: can read and update their own profile
    {
      action: PermissionAction.READ,
      scope: PermissionScope.OWN,
      resource: PermissionResource.USER,
    },
    {
      action: PermissionAction.UPDATE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.USER,
    },
    {
      action: PermissionAction.DELETE,
      scope: PermissionScope.OWN,
      resource: PermissionResource.USER,
    },
  ];

  const userPermissionIds = (
    await Promise.all(
      userPermissions.map(permission =>
        prisma.permission.findFirst({
          where: {
            action: permission.action,
            scope: permission.scope,
            resource: permission.resource,
          },
          select: {
            id: true,
          },
        }),
      ),
    )
  ).map(permission => permission.id);

  await Promise.all(
    userPermissionIds.map(id =>
      prisma.rolePermission.upsert({
        create: {
          roleId: 1,
          permissionId: id,
        },
        where: {
          roleId_permissionId: {
            roleId: 1,
            permissionId: id,
          },
        },
        update: {},
      }),
    ),
  );

  console.log(
    `✅ Seeded ${userPermissions.length} permissions for User role successfully.`,
  );
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
