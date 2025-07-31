import { NextFunction, Request, Response } from 'express';
import db from '../prisma/db';
import { PermissionResource } from '@prisma/client';
import ResourceURLParser from '../utils/ResourceURLParser';
import morgan = require('morgan');

type Log = {
  method: string;
  endpoint: string;
  statusCode: number;
  errorMessage: string | null;
  responseTime: number;
  resourceType: PermissionResource;
  resourceId: string | null;
  userAgent: string;
  userId: number;
  ip: string | null;
};

export default class LogController {
  private static requestLogBuffer: Log[] = [];
  private static BATCH_SIZE = 100;
  private static FLUSH_INTERVAL = 5000;
  private static processing: Boolean = false;
  private static flushTimerId: NodeJS.Timeout | null = null;

  static async flushBuffer() {
    if (LogController.processing || LogController.requestLogBuffer.length === 0)
      return;

    LogController.processing = true;

    const logsToFlush = [...LogController.requestLogBuffer];
    LogController.requestLogBuffer = [];

    try {
      await db.aPIRequestLog.createMany({
        data: logsToFlush,
      });
    } catch (error) {
      console.log(`Error while flushing buffered logs to database: ${error}`);
    } finally {
      LogController.processing = false;
    }
  }

  static logRequest(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', async () => {
      try {
        const diff = Date.now() - start;
        const resourceInfo = ResourceURLParser.getResourceInfoFromUrl(
          req.originalUrl,
        );

        LogController.requestLogBuffer.push({
          method: req.method,
          endpoint: req.originalUrl,
          resourceType: resourceInfo.type,
          resourceId: resourceInfo.name || null,
          statusCode: res.statusCode,
          errorMessage: res.locals?.error?.message || null,
          responseTime: diff,
          userAgent: req.headers['user-agent'] || 'Unknown',
          userId: req.user.id,
          ip: req.ip || null,
        });

        if (LogController.requestLogBuffer.length >= LogController.BATCH_SIZE)
          LogController.flushBuffer();
      } catch (error) {
        console.error('[Log] Error while logging request:', error);
      }
    });

    next();
  }

  static initializeFlushTimer() {
    if (LogController.flushTimerId) return;

    LogController.flushTimerId = setInterval(
      LogController.flushBuffer,
      LogController.FLUSH_INTERVAL,
    );

    console.log(
      `[Logs] API log flushing scheduled every ${
        LogController.FLUSH_INTERVAL / 1000
      } seconds.`,
    );
  }

  static stopFlushTimer() {
    if (!LogController.flushTimerId) return;

    clearInterval(LogController.flushTimerId);
    LogController.flushTimerId = null;
    console.log(`[Logs] API log flushing stopped.`);
  }

  static morgan() {
    // Morgan logging settings
    morgan.token('user-id', (req: any) => {
      // Assuming you've already attached req.user in middleware
      return req.user?.id || 'anonymous';
    });

    const formatWithUser =
      '[:date[iso]] user.id=:user-id raddr=:remote-addr :method :url :status - rtime=:response-time ms referrer=":referrer" uagent=":user-agent"';

    return morgan(formatWithUser);
  }
}
