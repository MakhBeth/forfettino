import { useState, useEffect, useRef } from 'react';
import { dbManager } from '../lib/db/IndexedDBManager';

export function useDatabase() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const initStarted = useRef(false);

  useEffect(() => {
    // Prevent double init from StrictMode
    if (initStarted.current) {
      console.log('[useDatabase] Init already started, skipping');
      return;
    }
    initStarted.current = true;

    const initDB = async () => {
      try {
        console.log('[useDatabase] Initializing DB...');
        await dbManager.init();
        console.log('[useDatabase] DB initialized, db:', dbManager.db);
        setDbReady(true);
      } catch (error) {
        console.error('[useDatabase] Errore inizializzazione DB:', error);
        setDbError(error as Error);
      }
    };
    initDB();
  }, []);

  return { dbManager, dbReady, dbError };
}
