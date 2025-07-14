import db from '../prisma/db';
import {
  Role as PrismaRole,
  Permission as PrismaPermission,
  PermissionAction,
  PermissionScope,
  PermissionResource,
} from '@prisma/client';
import AppError from '../utils/AppError';

type PartialPermission = {
  id: number;
  action: PermissionAction;
  scope: PermissionScope;
  resource: PermissionResource;
};

export default class RoleModel {
  private data: Partial<PrismaRole>;

  public static rolePermissionMap: Record<string, Set<PartialPermission>> =
    Object.create(null);

  public hasPermission(
    action: PermissionAction,
    scope: PermissionScope,
    resource: PermissionResource,
  ): boolean {
    // Handle the SuperAdmin role case
    if (this.id === 0) return true;

    const perms = Array.from(RoleModel.rolePermissionMap[this.name]);

    const hasPermissibleScope = function (perm: PartialPermission): Boolean {
      if (scope === PermissionScope.ANY)
        return perm.scope === PermissionScope.ANY;
      else return true; // OWN is less restrictive, so both OWN and ANY should give it access
    };

    return perms.some(
      perm =>
        perm.action === action &&
        perm.resource === resource &&
        hasPermissibleScope(perm),
    );
  }

  public getPermissions(): PartialPermission[] {
    return Array.from(RoleModel.rolePermissionMap[this.name] ?? []);
  }

  public static async refreshPermissionCache() {
    const roles = await db.role.findMany({
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                action: true,
                scope: true,
                resource: true,
              },
            },
          },
        },
      },
    });

    // Clear existing cache
    Object.keys(RoleModel.rolePermissionMap).forEach(
      key => delete RoleModel.rolePermissionMap[key],
    );

    // Rebuild map
    for (const role of roles) {
      RoleModel.rolePermissionMap[role.name] = new Set(
        role.permissions.map(rp => rp.permission),
      );
    }

    console.log(
      '[Auth] Permission cache refreshed:',
      Object.entries(RoleModel.rolePermissionMap),
    );
  }

  constructor(data: Partial<PrismaRole>) {
    this.data = data;

    if (this.data.id === undefined)
      throw new AppError('Cannot create role without ID.', 500);

    if (this.data.name === undefined)
      throw new AppError('Cannot create role without name.', 500);
  }

  get id(): number {
    return this.data.id!;
  }

  get name(): string {
    return this.data.name!;
  }

  toJSON() {
    return this.data;
  }

  static async findById(id: number): Promise<RoleModel> {
    const roleData = await db.role.findUnique({
      where: {
        id,
      },
    });

    if (!roleData) throw new AppError(`Couldn't find role with ID ${id}`, 404);

    return new RoleModel(roleData);
  }
}
