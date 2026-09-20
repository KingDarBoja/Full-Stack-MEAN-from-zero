import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { connectDB, closeDB } from './config/database';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// --------------------- Express Application -------------------- //

const app = express();

// ---------------- JSON Body Parsing Middleware ---------------- //

app.use(express.json());

// --------------------------- Routes --------------------------- //

app.get('/', (_req: Request, res: Response) => {
  res.send({ message: 'Hello API' });
});

/**
 * Health check endpoint.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------- Error Handling Middleware ----------------- //

/**
 * The error handling middleware is used to catch and handle errors that occur
 * during the request processing.
 *
 * @param err Error object
 * @param _req Request object
 * @param res Response object
 * @param _next Next function This is required to be present as it is a middleware.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]:', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// ------------------------- Bootstrap ------------------------- //

/**
 * Bootstrap the application. This initializes the MongoClient, starts the HTTP
 * server, and sets up graceful shutdown handlers.
 */
async function bootstrap() {
  try {
    /**
     * Establish DB connection first.
     * @returns {Promise<void>} Promise that resolves when the database is
     * connected.
     */
    await connectDB();

    /**
     * Start HTTP server.
     * @param port Port number
     * @param host Hostname
     */
    const server = app.listen(port, host, () => {
      console.log(`[ ready ] http://${host}:${port}`);
    });

    /**
     * Graceful shutdown handler.
     * @param signal Signal received
     */
    const shutdown = async (signal: string) => {
      console.log(`\n[${signal}] Shutting down server...`);
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Bootstrap Error]:', error);
    process.exit(1);
  }
}

// ----------------- Start the application ----------------- //

bootstrap();
