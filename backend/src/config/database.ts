import { MongoClient, Db, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'sample_mflix';

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

let client: MongoClient;
let db: Db;

/**
 * Connects to the MongoDB database.
 * @returns {Promise<Db>} The database connection.
 */
export async function connectDB(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    // Best practice pool settings for web servers
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db(dbName);
  console.log(`[MongoDB] Connected to database: "${dbName}"`);
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('[MongoDB] Connection closed.');
  }
}
