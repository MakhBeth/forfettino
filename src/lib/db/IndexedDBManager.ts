import type { StoreName } from '../../types';
import { DB_NAME, DB_VERSION, STORES } from '../constants/fiscali';

export class IndexedDBManager {
  db: IDBDatabase | null;

  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: any) => {
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
      };
    });
  }

  async getAll(storeName: StoreName): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async get(storeName: StoreName, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(storeName: StoreName, data: any): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName: StoreName, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(storeName: StoreName): Promise<void> {
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

  async importAll(data: Record<string, any[]>): Promise<void> {
    for (const store of STORES) {
      if (data[store]) {
        await this.clear(store);
        for (const item of data[store]) {
          await this.put(store, item);
        }
      }
    }
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();
