import db from '../prisma/db';
import {
  Role as PrismaRole,
  Permission as PrismaPermission,
  PermissionAction,
  PermissionScope,
  PermissionResource,
} from '@prisma/client';
import AppError from '../utils/AppError';
import { ModelFactory } from './ModelFactory';
import roleSchema, {
  PermissionArrayInput,
  permissionArrayInputSchema,
} from '../schema/role.schema';

type PartialPermission = {
  id: number;
  action: PermissionAction;
  scope: PermissionScope;
  resource: PermissionResource;
};

export default class RoleModel {
  private data: Partial<PrismaRole>;

  private static wrapper(data: PrismaRole): RoleModel {
    return new RoleModel(data);
  }

  public static rolePermissionMap: Record<string, Set<PartialPermission>> =
    Object.create(null);

  public async addPermissions(permissionIds: PermissionArrayInput) {
    if (permissionIds.length === 0) return;

    const validatedPermissionIdArray =
      permissionArrayInputSchema.safeParse(permissionIds);

    if (validatedPermissionIdArray.error)
      throw new AppError(
        `Invalid input: $[ ${validatedPermissionIdArray.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    await db.rolePermission.createMany({
      data: validatedPermissionIdArray.data.map(permId => ({
        permissionId: permId,
        roleId: this.id,
      })),
      // skipDuplicates: true, // So that it does not err on duplicates (simply ignores it)
    });

    await RoleModel.refreshPermissionCache();
  }

  public async removePermissions(permissionIds: PermissionArrayInput) {
    if (permissionIds.length === 0) return;

    const validatedPermissionIdArray =
      permissionArrayInputSchema.safeParse(permissionIds);

    if (validatedPermissionIdArray.error)
      throw new AppError(
        `Invalid input: [ ${validatedPermissionIdArray.error.issues.map(
          issue => issue.message,
        )} ]`,
        400,
      );

    await db.rolePermission.deleteMany({
      where: {
        roleId: this.id,
        permissionId: { in: validatedPermissionIdArray.data },
      },
    });

    await RoleModel.refreshPermissionCache();
  }

  public hasPermission(
    action: PermissionAction,
    requestedScope: PermissionScope,
    resource: PermissionResource,
  ): boolean {
    // SuperAdmin always has all permissions
    if (this.id === 0) return true;

    const permsOfThisRole = Array.from(RoleModel.rolePermissionMap[this.name]);

    return permsOfThisRole.some(perm => {
      // Check if action and resource match
      if (perm.action !== action || perm.resource !== resource) {
        return false;
      }

      // Now, check the scope hierarchy
      switch (perm.scope) {
        case PermissionScope.RESTRICTED:
          // If the role has RESTRICTED access, it implicitly covers ALL and OWN for this action/resource
          // A permission with scope 'RESTRICTED' implies the ability to access all instances,
          // including 'ANY' (All) and 'OWN'.
          return true; // If role has RESTRICTED, it satisfies any requestedScope for this action/resource

        case PermissionScope.ANY:
          // If the role has ANY access, it implicitly covers OWN for this action/resource.
          // It does NOT cover RESTRICTED.
          return (
            requestedScope === PermissionScope.ANY ||
            requestedScope === PermissionScope.OWN
          );

        case PermissionScope.OWN:
          // If the role has OWN access, it only covers OWN.
          // It does NOT cover ANY or RESTRICTED.
          return requestedScope === PermissionScope.OWN;

        default:
          // For any other specific scope, it must be an exact match
          return perm.scope === requestedScope;
      }
    });
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
      '[Auth] Permission cache refreshed.',
      // Object.entries(RoleModel.rolePermissionMap),
    );
  }

  constructor(data: Partial<PrismaRole>) {
    this.data = data;
  }

  get id(): number {
    if (this.data.id === undefined)
      throw new AppError('Role id field undefined.', 500);

    return this.data.id!;
  }

  get name(): string {
    return this.data.name || '';
  }

  toJSON() {
    return this.data;
  }

  static createOne = ModelFactory.createOne(
    db.role,
    roleSchema,
    RoleModel.wrapper,
  );

  static findMany = ModelFactory.findMany(
    db.role,
    roleSchema,
    RoleModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.role,
    roleSchema,
    RoleModel.wrapper,
  );

  static findCreatorIdById = ModelFactory.findCreatorIdById(db.role);

  static updateOne = ModelFactory.updateOne(
    db.role,
    roleSchema,
    RoleModel.wrapper,
  );

  static deleteOne = ModelFactory.deleteOne(db.role, RoleModel.wrapper);
}
