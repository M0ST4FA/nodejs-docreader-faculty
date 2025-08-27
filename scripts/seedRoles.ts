import {
  PrismaClient,
  PermissionAction,
  PermissionScope,
  PermissionResource,
  Permission as PrismaPermission,
} from '@prisma/client';

type Permission = {
  action: PermissionAction;
  scope: PermissionScope;
  resource: PermissionResource;
  description?: string;
};

type RoleDescription = {
  name: string;
  description: string;
  permissions: Permission[];
};

const prisma = new PrismaClient();
const DEFAULT_ROLES: RoleDescription[] = [
  { name: 'Founder', description: 'Thank me later...', permissions: [] },
  {
    name: 'SuperAdmin',
    description: 'Administrator on steroids',
    permissions: [
      // 1. USER, ROLE & PERMISSION: Nothing more than what a normal user can do

      // -----------------------------------------------------------
      // 2. RESOURCES: Module, Subject, Lecture and Quiz : All permissions
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.MODULE,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.SUBJECT,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LECTURE,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LINK,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUIZ,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUESTION,
      },

      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.MODULE,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.SUBJECT,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LECTURE,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LINK,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUIZ,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUESTION,
      },

      // -----------------------------------------------------------
      // 3. DEVICES, NOTIFICATIONS & TOPICS: Can create topics. Can also delete and update own topic
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.TOPIC,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.TOPIC,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.TOPIC,
      },
    ],
  },
  {
    name: 'Admin',
    description: 'Normal administrator',
    permissions: [
      // 1. USER, ROLE & PERMISSION: Nothing more than what a normal user can do

      // -----------------------------------------------------------
      // 2. RESOURCES: For Module, Subject, Lecture, Link, Quiz, and Question: Add, update and delete their OWN material only
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.MODULE,
      },
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.SUBJECT,
      },
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LECTURE,
      },
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LINK,
      },
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUIZ,
      },
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUESTION,
      },

      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.MODULE,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.SUBJECT,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.LECTURE,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.LINK,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.QUIZ,
      },
      {
        action: PermissionAction.UPDATE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.QUESTION,
      },

      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.MODULE,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.SUBJECT,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.LECTURE,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.LINK,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.QUIZ,
      },
      {
        action: PermissionAction.DELETE,
        scope: PermissionScope.OWN,
        resource: PermissionResource.QUESTION,
      },

      // -----------------------------------------------------------
      // 3. DEVICES, NOTIFICATIONS & TOPICS: Can send notifications and read and subscribe restricted topics
      {
        action: PermissionAction.SEND,
        scope: PermissionScope.ANY,
        resource: PermissionResource.NOTIFICATION,
      },
      {
        action: PermissionAction.READ,
        scope: PermissionScope.RESTRICTED,
        resource: PermissionResource.TOPIC,
      },
      {
        action: PermissionAction.SUBSCRIBE,
        scope: PermissionScope.RESTRICTED,
        resource: PermissionResource.TOPIC,
      },
    ],
  },
  {
    name: 'User',
    description: 'Default user role',
    permissions: [
      // 1. USER, ROLE & PERMISSION: Can read and update their own profile and read any role and permission
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

      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.ROLE,
      },
      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.PERMISSION,
      },

      // -----------------------------------------------------------
      // 2. RESOURCES: Faculty, Year, Module, Subject, Lecture: Read-only access to academic structure
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
      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.LINK,
      },
      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUIZ,
      },
      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.QUESTION,
      },

      // -----------------------------------------------------------
      // 3. DEVICES, NOTIFICATIONS & TOPICS: Only read any notification or topic and do most things with devices
      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.NOTIFICATION,
      },
      {
        action: PermissionAction.READ,
        scope: PermissionScope.ANY,
        resource: PermissionResource.TOPIC,
      },
      {
        action: PermissionAction.SUBSCRIBE,
        scope: PermissionScope.ANY,
        resource: PermissionResource.TOPIC,
      },

      // Device: users can register and manage their own devices
      {
        action: PermissionAction.CREATE,
        scope: PermissionScope.ANY,
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
    ],
  },
];

async function seedDefaultRoles() {
  console.log(`🌱 Seeding default roles...`);

  const rolePromises: Promise<any>[] = [];

  for (let id: number = 0; id < DEFAULT_ROLES.length; id++)
    // Insert the two most basic roles
    rolePromises.push(
      prisma.role.upsert({
        create: {
          id,
          name: DEFAULT_ROLES[id].name,
          description: DEFAULT_ROLES[id].description,
        },
        where: {
          name: DEFAULT_ROLES[id].name,
        },
        update: {},
      }),
    );

  await Promise.all(rolePromises);

  console.log('✅ Seeded default roles successfully.');
}

async function getPermissionsForRole(
  roleId: number,
): Promise<(PrismaPermission | null)[]> {
  const rolePermissionDescriptions = DEFAULT_ROLES[roleId].permissions;
  const promises = rolePermissionDescriptions.map(permissionDesc =>
    prisma.permission.findFirst({
      where: {
        action: permissionDesc.action,
        scope: permissionDesc.scope,
        resource: permissionDesc.resource,
      },
    }),
  );

  const rolePermissions = await Promise.all(promises);

  return rolePermissions;
}

async function insertPermissionsForRole(
  roleId: number,
  permissions: (PrismaPermission | null)[],
) {
  const filteredPermissions = permissions.filter(
    permission => permission !== null,
  );

  const promises = filteredPermissions.map(permission =>
    prisma.rolePermission.upsert({
      create: {
        roleId,
        permissionId: permission.id,
      },
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      update: {},
    }),
  );

  return await Promise.all(promises);
}

async function insertPermissionsForLowerTierRolesStartingFrom(
  roleId: number,
  permissions: (PrismaPermission | null)[],
) {
  const promises = [];

  for (let i = roleId; i > 0; i--)
    promises.push(insertPermissionsForRole(i, permissions));

  return await Promise.all(promises);
}

async function seedDefaultRolePermissions() {
  for (let roleId = DEFAULT_ROLES.length - 1; roleId >= 0; roleId--) {
    console.log(
      `🌱 Seeding '${DEFAULT_ROLES[roleId].name}' role permissions...`,
    );

    const permissions = await getPermissionsForRole(roleId);
    await Promise.all([
      insertPermissionsForRole(roleId, permissions),
      insertPermissionsForLowerTierRolesStartingFrom(roleId - 1, permissions),
    ]),
      console.log(
        `✅ Seeded '${DEFAULT_ROLES[roleId].name}' role permissions.`,
      );
  }
}

async function main() {
  await seedDefaultRoles().then(seedDefaultRolePermissions);
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
