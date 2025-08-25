import db from '../prisma/db';
import userSchema, { UserQueryParamInput } from '../schema/user.schema';
import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import AppError from '../utils/AppError';
import RoleModel from './Role';
import { ModelFactory } from './ModelFactory';
import { QueryParamsService } from '../utils/QueryParamsService';

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

  get yearId(): number {
    if (this.data.yearId === undefined || this.data.yearId === null)
      throw new AppError('User yearId field undefined.', 500);

    return this.data.yearId;
  }

  get facultyId(): number {
    if (this.data.facultyId === undefined || this.data.facultyId === null)
      throw new AppError('User facultyId field undefined.', 500);

    return this.data.facultyId;
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

  static async findMany(query: any) {
    const search = query?.search;
    delete query?.search;

    const validatedQueryParams: any = QueryParamsService.parse<
      typeof userSchema.query
    >(userSchema, query, {
      pagination: true,
      projection: true,
      sorting: true,
      joining: true,
    });

    let users;
    let total = 0;

    const where: any = {
      email: {
        contains: search,
        mode: 'insensitive',
      },
    };

    if (validatedQueryParams.include)
      [users, total] = await Promise.all([
        db.user.findMany({
          where,
          include: validatedQueryParams.include,
          orderBy: validatedQueryParams.orderBy,
          skip: validatedQueryParams.skip,
          take: validatedQueryParams.take,
        }),
        db.user.count({ where }),
      ]);
    else
      [users, total] = await Promise.all([
        db.user.findMany({
          where,
          orderBy: validatedQueryParams.orderBy,
          skip: validatedQueryParams.skip,
          take: validatedQueryParams.take,
        }),
        db.user.count({ where }),
      ]);

    return [users, total];
  }

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
