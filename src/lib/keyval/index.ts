const DATABASE_NAME = "keyval";
const OBJECT_STORE_NAME = "keyval";
const KEY_PATH = "key";


export interface KeyValStore {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export function openDB(): Promise<KeyValStore> {
  return new Promise<KeyValStore>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (! db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        const objectStore = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: KEY_PATH });

        objectStore.createIndex(KEY_PATH, KEY_PATH, { unique: true });
      }
    };

    request.onerror = reject;
    request.onsuccess = () => {
      const db = request.result;

      resolve({
        get: <T>(key: string) => new Promise<T | null>((resolve, reject) => {
          const readTransaction = db.transaction(DATABASE_NAME, "readonly");
          const readStore = readTransaction.objectStore(OBJECT_STORE_NAME);
          const readRequest = readStore.get(key);

          readRequest.onerror = reject;
          readRequest.onsuccess = () => {
            resolve(readRequest.result?.value ?? null);
          };
        }),
        set: async <T>(key: string, value: T | null) => new Promise<void>((resolve, reject) => {
          const modifyTransaction = db.transaction(DATABASE_NAME, "readwrite");
          const modifyStore = modifyTransaction.objectStore(OBJECT_STORE_NAME);

          if (value === null) {
            const deleteRequest = modifyStore.delete(key);

            deleteRequest.onerror = reject;
            deleteRequest.onsuccess = () => resolve();
          }
          else {
            const writeRequest = modifyStore.put({ key, value });

            writeRequest.onerror = reject;
            writeRequest.onsuccess = () => resolve();
          }
        }),
        delete: (key) => new Promise<void>((resolve, reject) => {
          const modifyTransaction = db.transaction(DATABASE_NAME, "readwrite");
          const modifyStore = modifyTransaction.objectStore(OBJECT_STORE_NAME);
          const deleteRequest = modifyStore.delete(key);

          deleteRequest.onerror = reject;
          deleteRequest.onsuccess = () => resolve();
        }),
      });
    };
  });
}
