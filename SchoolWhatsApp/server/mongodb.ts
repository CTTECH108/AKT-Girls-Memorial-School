import { MongoClient, Db, Collection, Document } from 'mongodb';
import { Student, Message, User } from '@shared/schema';

class MongoDB {
  private client: MongoClient;
  private db: Db | null = null;
  private isConnected = false;

  constructor() {
    const mongoUrl = 'mongodb+srv://bastoffcial:aI4fEcricKXwBZ4f@speedo.swuhr8z.mongodb.net/';
    this.client = new MongoClient(mongoUrl);
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        this.db = this.client.db('school_management');
        this.isConnected = true;
        console.log('Connected to MongoDB successfully');
      }
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  getCollection<T extends Document = Document>(collectionName: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection<T>(collectionName);
  }

  async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}

export const mongodb = new MongoDB();

// Initialize connection on startup
mongodb.connect().catch(console.error);