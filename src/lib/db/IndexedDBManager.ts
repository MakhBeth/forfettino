import type { StoreName, User } from '../../types';
import { DB_NAME, DB_VERSION, STORES } from '../constants/fiscali';

export class IndexedDBManager {
  db: IDBDatabase | null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.db = null;
  }

  async init(): Promise<IDBDatabase> {
    // If already initialized, return existing db
    if (this.db) {
      console.log('[DB] Already initialized, returning existing connection');
      return this.db;
    }

    // If init is in progress, wait for it
    if (this.initPromise) {
      console.log('[DB] Init already in progress, waiting...');
      return this.initPromise;
    }

    // Start init
    this.initPromise = this.doInit();
    try {
      const db = await this.initPromise;
      return db;
    } finally {
      this.initPromise = null;
    }
  }

  private async doInit(): Promise<IDBDatabase> {
    // First, try to close any existing connections by opening without version
    try {
      console.log('[DB] Closing any existing connections...');
      await this.closeExistingConnections();
    } catch (e) {
      console.warn('[DB] Could not close existing connections:', e);
    }

    // Try to open normally
    try {
      return await this.openDatabase();
    } catch (error: any) {
      // If blocked or stuck, try to delete and recreate
      if (error.name === 'TimeoutError' || error.name === 'BlockedError') {
        console.warn('[DB] Database blocked, attempting to delete and recreate...');
        await this.deleteDatabase();
        return await this.openDatabase();
      }
      throw error;
    }
  }

  private closeExistingConnections(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME);

      const timeout = setTimeout(() => {
        console.log('[DB] Close connections timeout');
        resolve();
      }, 1000);

      request.onsuccess = () => {
        clearTimeout(timeout);
        const db = request.result;
        console.log('[DB] Existing connection opened, version:', db.version, '- closing...');
        db.close();
        resolve();
      };

      request.onerror = () => {
        clearTimeout(timeout);
        console.log('[DB] No existing connection to close');
        resolve();
      };
    });
  }

  private deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[DB] Deleting database...');
      const request = indexedDB.deleteDatabase(DB_NAME);

      const timeout = setTimeout(() => {
        console.warn('[DB] Delete timeout, continuing anyway...');
        resolve();
      }, 3000);

      request.onsuccess = () => {
        clearTimeout(timeout);
        console.log('[DB] Database deleted');
        resolve();
      };
      request.onerror = () => {
        clearTimeout(timeout);
        console.error('[DB] Error deleting database:', request.error);
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('[DB] Delete blocked, waiting...');
        // Don't resolve yet, wait for success or timeout
      };
    });
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      console.log('[DB] Opening database version', DB_VERSION);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Timeout to detect stuck database
      const timeout = setTimeout(() => {
        console.error('[DB] Database open timeout - likely blocked');
        const error = new Error('Database open timeout');
        error.name = 'TimeoutError';
        reject(error);
      }, 3000);

      request.onerror = () => {
        clearTimeout(timeout);
        console.error('[DB] Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        console.log('[DB] Database opened successfully');
        this.db = request.result;

        // Handle version change from other tabs
        this.db.onversionchange = () => {
          console.log('[DB] Version change detected, closing connection');
          this.db?.close();
          this.db = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event: any) => {
        console.log('[DB] Upgrade needed, old version:', event.oldVersion, 'new version:', event.newVersion);
        const db = event.target.result;
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clienti')) {
          db.createObjectStore('clienti', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('fatture')) {
          db.createObjectStore('fatture', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workLogs')) {
          db.createObjectStore('workLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('scadenze')) {
          db.createObjectStore('scadenze', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        console.log('[DB] Upgrade complete');
      };

      request.onblocked = () => {
        clearTimeout(timeout);
        console.warn('[DB] Database upgrade blocked');
        const error = new Error('Database upgrade blocked');
        error.name = 'BlockedError';
        reject(error);
      };
    });
  }

  async getAll(storeName: StoreName): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllForUser(storeName: StoreName, userId: string): Promise<any[]> {
    const all = await this.getAll(storeName);
    return all.filter((item: any) => item.userId === userId);
  }

  async get(storeName: StoreName, key: string): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(storeName: StoreName, data: any): Promise<IDBValidKey> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName: StoreName, key: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(storeName: StoreName): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async exportAll(): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};
    for (const store of STORES) {
      data[store] = await this.getAll(store);
    }
    return data;
  }

  async exportForUser(userId: string): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};
    for (const store of STORES) {
      if (store === 'users') {
        // Export only the current user
        const users = await this.getAll('users');
        data[store] = users.filter((u: User) => u.id === userId);
      } else {
        data[store] = await this.getAllForUser(store, userId);
      }
    }
    return data;
  }

  async importAll(data: Record<string, any[]>): Promise<void> {
    console.log('[DB] importAll starting, stores in data:', Object.keys(data));
    for (const store of STORES) {
      if (data[store]) {
        console.log(`[DB] Importing ${store}: ${data[store].length} items`);
        await this.clear(store);
        for (const item of data[store]) {
          await this.put(store, item);
        }
      }
    }
    console.log('[DB] importAll complete');
  }

  async migrateToMultiUser(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    console.log('[DB] migrateToMultiUser starting...');
    // Check if users already exist
    const existingUsers = await this.getAll('users');
    console.log('[DB] Existing users:', existingUsers);
    if (existingUsers.length > 0) {
      // Migration already done, return the first user's id
      console.log('[DB] Migration already done, returning:', existingUsers[0].id);
      return existingUsers[0].id;
    }

    console.log('[DB] Creating default user...');
    // Create the default user
    const defaultUserId = 'user_' + Date.now().toString();
    const defaultUser: User = {
      id: defaultUserId,
      nome: 'Utente Principale',
      createdAt: new Date().toISOString()
    };
    await this.put('users', defaultUser);
    console.log('[DB] Default user created:', defaultUserId);

    // Migrate config: rename 'main' to 'config_${userId}' and add userId
    const oldConfig = await this.get('config', 'main');
    console.log('[DB] Old config:', oldConfig);
    if (oldConfig) {
      const newConfig = {
        ...oldConfig,
        id: `config_${defaultUserId}`,
        userId: defaultUserId
      };
      await this.put('config', newConfig);
      await this.delete('config', 'main');
      console.log('[DB] Config migrated');
    }

    // Migrate clienti
    const clienti = await this.getAll('clienti');
    for (const cliente of clienti) {
      if (!cliente.userId) {
        await this.put('clienti', { ...cliente, userId: defaultUserId });
      }
    }

    // Migrate fatture
    const fatture = await this.getAll('fatture');
    for (const fattura of fatture) {
      if (!fattura.userId) {
        await this.put('fatture', { ...fattura, userId: defaultUserId });
      }
    }

    // Migrate workLogs
    const workLogs = await this.getAll('workLogs');
    for (const workLog of workLogs) {
      if (!workLog.userId) {
        await this.put('workLogs', { ...workLog, userId: defaultUserId });
      }
    }

    // Migrate scadenze
    const scadenze = await this.getAll('scadenze');
    for (const scadenza of scadenze) {
      if (!scadenza.userId) {
        await this.put('scadenze', { ...scadenza, userId: defaultUserId });
      }
    }

    console.log('[DB] Migration complete, returning:', defaultUserId);
    return defaultUserId;
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();
