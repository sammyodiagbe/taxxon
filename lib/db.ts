import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { TaxDocument, DocumentType } from '@/types/tax-filing';

interface StoredDocument {
  id: string;
  filingId: string;
  name: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  uploadedAt: string;
  blob: Blob;
}

interface TaxxonDB extends DBSchema {
  documents: {
    key: string;
    value: StoredDocument;
    indexes: { 'by-filing': string };
  };
}

let dbInstance: IDBPDatabase<TaxxonDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<TaxxonDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TaxxonDB>('taxxon-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('documents', { keyPath: 'id' });
      store.createIndex('by-filing', 'filingId');
    },
  });

  return dbInstance;
}

export async function saveDocument(
  filingId: string,
  document: TaxDocument,
  blob: Blob
): Promise<void> {
  const db = await getDB();
  await db.put('documents', {
    ...document,
    filingId,
    blob,
  });
}

export async function getDocuments(filingId: string): Promise<(TaxDocument & { blob: Blob })[]> {
  const db = await getDB();
  return db.getAllFromIndex('documents', 'by-filing', filingId);
}

export async function getDocument(id: string): Promise<(TaxDocument & { blob: Blob }) | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}

export async function deleteAllDocuments(filingId: string): Promise<void> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('documents', 'by-filing', filingId);
  const tx = db.transaction('documents', 'readwrite');
  await Promise.all(docs.map((doc) => tx.store.delete(doc.id)));
  await tx.done;
}
