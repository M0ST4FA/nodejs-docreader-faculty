import { Request, Response, NextFunction } from 'express';

const catchAsync = function (fun: Function) {
  return function (req: Request, res: Response, next: NextFunction) {
    fun(req, res, next).catch(next);
  };
};

export default catchAsync;
