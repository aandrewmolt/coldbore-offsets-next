const DEFAULT_DB_NAME = 'shearfrac-photos';
const DB_VERSION = 1;
const STORE_NAME = 'photo-binaries';

interface PhotoBinary {
  id: string;
  dataUrl: string;
  jpegUrl: string;
}

function openDB(dbName: string = DEFAULT_DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhotoBinaries(
  photos: Array<{ id: string; dataUrl: string; jpegUrl: string }>,
  dbName?: string
): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDB(dbName);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const photo of photos) {
    store.put({ id: photo.id, dataUrl: photo.dataUrl, jpegUrl: photo.jpegUrl });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadPhotoBinaries(
  photoIds: string[],
  dbName?: string
): Promise<Map<string, { dataUrl: string; jpegUrl: string }>> {
  const result = new Map<string, { dataUrl: string; jpegUrl: string }>();
  if (typeof indexedDB === 'undefined' || photoIds.length === 0) return result;
  const db = await openDB(dbName);
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const promises = photoIds.map(
    (id) =>
      new Promise<void>((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => {
          const val = req.result as PhotoBinary | undefined;
          if (val) {
            result.set(id, { dataUrl: val.dataUrl, jpegUrl: val.jpegUrl });
          }
          resolve();
        };
        req.onerror = () => resolve();
      })
  );

  await Promise.all(promises);
  db.close();
  return result;
}

export async function deletePhotoBinaries(photoIds: string[], dbName?: string): Promise<void> {
  if (typeof indexedDB === 'undefined' || photoIds.length === 0) return;
  const db = await openDB(dbName);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const id of photoIds) {
    store.delete(id);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearAllPhotoBinaries(dbName?: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDB(dbName);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
