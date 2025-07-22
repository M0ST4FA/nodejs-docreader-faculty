import db from '../prisma/db';
import {
  UserCreateInput,
  UserQueryParamInput,
  UserUpdateInput,
  UserWhereInput,
} from '../schema/user.schema';
import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import AppError from '../utils/AppError';
import RoleModel from './Role';

type PartialUserWithRole = Partial<PrismaUser> & {
  role?: Partial<PrismaRole>;
};

class UserModel {
  private data: Partial<PartialUserWithRole>;

  private roleModel?: RoleModel;

  constructor(data: PartialUserWithRole) {
    this.data = data;

    if (this.data.role) {
      this.roleModel = new RoleModel(this.data.role);
    } // else left undefined, to be lazily fetched
  }

  get id(): number {
    if (!this.data.id)
      throw new AppError('User id field undefined.', 500, false);

    return this.data.id;
  }

  get roleId(): number {
    if (!this.data.roleId)
      throw new AppError('User roleId field undefined.', 500);

    return this.data.roleId;
  }

  async role(): Promise<RoleModel> {
    if (!this.roleModel)
      this.roleModel = new RoleModel(await RoleModel.findById(this.roleId));

    return this.roleModel;
  }

  toJSON() {
    const copy: any = {};

    Object.assign(copy, this.data);

    copy.googleSubId = undefined; // Should never be returned to front-end (very sensitive)

    return copy;
  }

  static async create(user: UserCreateInput): Promise<UserModel> {
    const userData = await db.user.create({
      data: {
        ...user,
        devices: {
          create: [],
        },
      },
    });

    return new UserModel(userData);
  }

  static async findOneById(id: number): Promise<UserModel> {
    const userData = await db.user.findUnique({
      where: {
        id: id,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!userData) throw new AppError(`Couldn't find user with ID ${id}`, 404);

    return new UserModel(userData);
  }

  static async findOneByGoogleSubId(sub: string): Promise<UserModel> {
    const userData = await db.user.findUnique({
      where: {
        googleSubId: sub,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!userData)
      throw new AppError(
        `Couldn't find user with google subject ID ${sub}`,
        404,
      );

    return new UserModel(userData);
  }

  static async findMany(
    where: UserWhereInput,
    queryParams?: UserQueryParamInput,
  ): Promise<Array<UserModel>> {
    const users = await db.user.findMany({
      where,
      select: queryParams?.select,
      orderBy: queryParams?.orderBy,
      skip: queryParams?.skip,
      take: queryParams?.take,
    });

    if (users.length === 0)
      throw new AppError(
        `Couldn't find any users based on provided criteria.`,
        404,
      );

    return users.map(user => new UserModel(user));
  }

  static async updateOne(
    id: number,
    updateInput: UserUpdateInput,
    queryParams?: UserQueryParamInput,
  ) {
    const updatedUser = await db.user.update({
      where: {
        id,
      },
      data: updateInput,
      select: queryParams?.select,
    });

    if (!updatedUser) {
      throw new AppError(`User with ID ${id} not found.`, 404);
    }

    return new UserModel(updatedUser);
  }

  static async updateRole(
    userId: number,
    roleId: number,
    queryParams?: UserQueryParamInput,
  ): Promise<UserModel> {
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      select: queryParams?.select,
      data: {
        roleId: roleId,
      },
    }); // Do not fetch role: if needed, the user will be able to fetch it automatically on first use of role()

    return new UserModel(updatedUser);
  }

  static async deleteOne(id: number): Promise<UserModel> {
    const user = await db.user.delete({
      where: {
        id,
      },
    });

    return new UserModel(user);
  }
}

export default UserModel;
