import permissionSchema from '../schema/permission.schema';
import { Permission as PrismaPermission } from '@prisma/client';
import db from '../prisma/db';
import { ModelFactory } from './ModelFactory';
import { QueryParamsService } from '../utils/QueryParamsService';

export default class PermissionModel {
  private data: Partial<PrismaPermission>;

  private static wrapper(data: PrismaPermission): PermissionModel {
    return new PermissionModel(data);
  }

  constructor(data: Partial<PrismaPermission>) {
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static findMany = ModelFactory.findMany(
    db.permission,
    permissionSchema,
    PermissionModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.permission,
    permissionSchema,
    PermissionModel.wrapper,
  );

  static async findPermissionsForRole(
    roleId: number,
    queryParams: unknown,
  ): Promise<PermissionModel[]> {
    const validatedQueryParams: any = QueryParamsService.parse(
      permissionSchema,
      queryParams,
      { projection: true },
    );

    const rolePermissions = await db.rolePermission.findMany({
      where: {
        roleId,
      },
      include: {
        permission: {
          select: validatedQueryParams.select,
        },
      },
    });

    return rolePermissions.map(
      rolePermission => new PermissionModel(rolePermission.permission),
    );
  }
}
