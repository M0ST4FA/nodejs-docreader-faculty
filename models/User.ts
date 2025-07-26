import db from '../prisma/db';
import userSchema, {
  UserCreateInput,
  UserQueryParamInput,
  UserUpdateInput,
  UserWhereInput,
} from '../schema/user.schema';
import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import AppError from '../utils/AppError';
import RoleModel from './Role';
import { ModelFactory } from './ModelFactory';

type PartialUserWithRole = Partial<PrismaUser> & {
  role?: Partial<PrismaRole>;
};

class UserModel {
  private data: Partial<PartialUserWithRole>;

  private roleModel?: RoleModel;

  private static wrapper(data: PrismaUser): UserModel {
    return new UserModel(data);
  }

  constructor(data: PartialUserWithRole) {
    this.data = data;

    if (this.data.role) {
      this.roleModel = new RoleModel(this.data.role);
    } // else left undefined, to be lazily fetched
  }

  get id(): number {
    if (!this.data.id) throw new AppError('User id field undefined.', 500);

    return this.data.id;
  }

  get roleId(): number {
    if (this.data.roleId === undefined)
      throw new AppError('User roleId field undefined.', 500);

    return this.data.roleId;
  }

  async role(): Promise<RoleModel> {
    if (!this.roleModel)
      this.roleModel = new RoleModel(
        await RoleModel.findOneById(this.roleId, {}),
      );

    return this.roleModel;
  }

  toJSON() {
    const copy: any = {};

    Object.assign(copy, this.data);

    copy.googleSubId = undefined; // Should never be returned to front-end (very sensitive)

    return copy;
  }

  static create = ModelFactory.createOne(
    db.user,
    userSchema,
    UserModel.wrapper,
  );

  static findOneById = ModelFactory.findOneById(
    db.user,
    userSchema,
    UserModel.wrapper,
  );
  static async findOneByGoogleSubId(sub: string): Promise<UserModel> {
    const userData = await db.user.findUnique({
      where: {
        googleSubId: sub,
      },
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        picture: true,
        facultyId: true,
        yearId: true,
      },
    });

    if (!userData)
      throw new AppError(
        `Couldn't find user with google subject ID ${sub}`,
        404,
      );

    return new UserModel(userData);
  }

  static findMany = ModelFactory.findMany(
    db.user,
    userSchema,
    UserModel.wrapper,
  );

  static updateOne = ModelFactory.updateOne(
    db.user,
    userSchema,
    UserModel.wrapper,
  );

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

  static deleteOne = ModelFactory.deleteOne(db.user);
}

export default UserModel;
