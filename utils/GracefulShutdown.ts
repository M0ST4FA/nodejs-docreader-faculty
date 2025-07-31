import { Server } from 'http';
import LogController from '../controllers/LogController';
import db from '../prisma/db';

export default class GracefulShutdown {
  private static shuttingDown: Boolean = false;

  private static async flushBuffers() {
    console.log(`[Shutdown] Flushing buffers...`);

    LogController.stopFlushTimer();
    await LogController.flushBuffer();

    console.log(`[Shutdown] All buffers flushed successfully.`);
  }

  private static async disconnectDatabase() {
    console.log(`[Shutdown] Disconnecting database...`);

    try {
      await db.$disconnect();
      console.log(`[Shutdown] Disconnected database successfully...`);
    } catch (error) {
      console.log('[Shutdown] Error while disconnecting database:', error);
    }
  }

  private static async shutdownServer(server: Server): Promise<number> {
    return new Promise(resolve =>
      server.close(async err => {
        try {
          console.log('[Shutdown] Beginning cleanup phase....');

          await GracefulShutdown.flushBuffers();
          await GracefulShutdown.disconnectDatabase();

          console.log('[Shutdown] All cleanup completed successfully.');

          if (err) console.error(`[Shutdown] Server closed with error: ${err}`);
          else console.log('[Shutdown] Server closed successfully.');

          resolve(err ? -1 : 0);
        } catch (error) {
          console.error('[Shutdown] Error during cleanup:', error);

          resolve(-1);
        }
      }),
    );
  }

  static async handler(server: Server, ...otherErrors: any[]) {
    if (GracefulShutdown.shuttingDown)
      return console.log(
        '[Shutdown] Already shutting down. Ignoring signal:',
        otherErrors[0] || 'Unknown',
      );

    GracefulShutdown.shuttingDown = true;

    const code = await GracefulShutdown.shutdownServer(server);

    console.log('[Shutdown] Other errors:', otherErrors);

    process.exit(code);
  }
}
