import { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import AppError from './AppError';

class JWTService {
  static JWT_PRIVATE_KEY = fs.readFileSync(
    `${import.meta.dirname}/../private.pem`,
  );
  static JWT_PUBLIC_KEY = fs.readFileSync(
    `${import.meta.dirname}/../public.pem`,
  );
  static JWT_COOKIE_EXPIRES_IN_DAYS = Number.parseInt(
    process.env.JWT_COOKIE_EXPIRES_IN_DAYS!,
  );

  static createJWT(id: number, role: string) {
    return jwt.sign({ id, role }, this.JWT_PRIVATE_KEY, {
      algorithm: 'ES384',
      expiresIn: `${this.JWT_COOKIE_EXPIRES_IN_DAYS}d`,
    });
  }

  static createAndSendJWT(
    id: number,
    role: string,
    res: Response,
    statusCode: number,
    responseBody: Object,
  ) {
    // 1) Create the token
    const token = this.createJWT(id, role);

    // 2) Set the cookie on the response

    const cookieOptions: CookieOptions = {
      maxAge:
        Date.now() + this.JWT_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // 3) Send the response
    if (responseBody && Object.keys(responseBody).length > 0)
      res.status(statusCode).send({
        status: 'success',
        token,
        data: {
          ...responseBody,
        },
      });
    else
      res.status(statusCode).send({
        status: 'success',
        token,
      });
  }

  static verifyJWT(token: string) {
    return jwt.verify(token, this.JWT_PUBLIC_KEY);
  }

  static extractJWT(req: Request, enforce = true) {
    const authHeader = req.headers.authorization;
    let token = req.cookies ? req.cookies.jwt : undefined;

    if (!token) {
      if (enforce && (!authHeader || !authHeader.startsWith('Bearer')))
        throw new AppError(
          "You're not logged in! Please log in to access this resource.",
          401,
        );

      token = authHeader?.split(' ')[1];
    }

    return token;
  }
}

export default JWTService;
