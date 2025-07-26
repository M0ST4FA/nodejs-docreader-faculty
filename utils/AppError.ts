enum ErrorStatus {
  'success',
  'fail',
  'error',
}

export default class AppError extends Error {
  public readonly status: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean = true;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;

    this.statusCode = statusCode;

    if (this.statusCode < 500) this.status = 'fail';
    else this.status = 'error';

    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
