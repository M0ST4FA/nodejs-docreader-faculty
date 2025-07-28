import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import AppError from '../utils/AppError';
import { NextFunction, Request, Response } from 'express';

class ErrorController {
  static #sendDevErrors(err: any, res: Response) {
    res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  static #sendProdErrors(error: any, res: Response) {
    // Operational, trusted errors: send message to client
    if (error?.name === 'AppError' && error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    } else {
      // Programming or unknown error
      console.error('UNEXPECTED ERROR 💥', error);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on the server.',
      });
    }
  }

  static #handlePrismaClientKnownRequestError(
    error: PrismaClientKnownRequestError,
  ) {
    const errorMeta = error?.meta;

    switch (error.code) {
      case 'P2002':
        if (errorMeta?.modelName === 'RolePermission') {
          if ((errorMeta?.target as any[])?.length === 2)
            // Not the best condition, but works 🥸
            return new AppError(
              `Every (roleId, permissionId) pair must be unique. It seems you're adding a permission a second time for the same role.`,
              400,
            );
        } else if (errorMeta?.modelName === 'Device')
          if ((errorMeta?.target as string[])?.includes('token'))
            return new AppError(
              `Duplicate token! A token with this ID already exists.`,
              400,
            );

        break;

      case 'P2003':
        if (errorMeta?.constraint === 'User_yearId_fkey')
          return new AppError(`Year with given ID not found.`, 400);
        if (errorMeta?.constraint === 'User_roleId_fkey')
          return new AppError(
            `Role with given ID not found. If you're creating a new user, make sure the role already exists.`,
            400,
          );
        else if (errorMeta?.constraint === 'User_facultyId_fkey')
          return new AppError(`Faculty with given ID not found.`, 400);
        else if (errorMeta?.constraint === 'RolePermission_roleId_fkey')
          return new AppError(`Role with given ID not found.`, 400);
        else if (errorMeta?.constraint === 'RolePermission_permissionId_fkey')
          return new AppError(`Permission with given ID not found.`, 400);

        break;
      case 'P2025': {
        const modelName = errorMeta?.modelName || 'Model';
        const message =
          errorMeta?.cause || 'No record was found for an update or delete.';

        return new AppError(`${modelName}: ${message}`, 404);
      }
      default:
        return error;
    }
  }

  static #handleJsonWebTokenError(error: any) {
    return new AppError(error.message, 400);
  }

  static #handleFCMError(error: any) {
    return new AppError(
      `${error.errorInfo.code}: ${error.errorInfo.message}.`,
      400,
    );
  }

  static #sendAPIErrors(err: any, res: Response) {
    let error = { ...err };

    // Ensure essential properties are preserved
    error.message = err.message;
    error.name = err.name;
    error.stack = err.stack;

    if (process.env.NODE_ENV === 'development') {
      ErrorController.#sendDevErrors(error, res);
    } else {
      if (error?.name === 'PrismaClientKnownRequestError')
        error = this.#handlePrismaClientKnownRequestError(error);

      if (error?.name === 'JsonWebTokenError')
        error = this.#handleJsonWebTokenError(error);

      if (error?.codePrefix === 'messaging')
        error = this.#handleFCMError(error);

      error = ErrorController.#sendProdErrors(error, res);
    }
  }

  static globalErrorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    ErrorController.#sendAPIErrors(err, res);
  }
}

export default ErrorController.globalErrorHandler;
