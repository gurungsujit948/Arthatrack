import { openDB } from 'idb';
import { Transaction } from '../types';

const DB_NAME = 'arthatrack_offline';
const STORE_NAME = 'pending_transactions';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
  },
});

export async function saveOfflineTransaction(transaction: Omit<Transaction, 'id'>) {
  const db = await dbPromise;
  return db.add(STORE_NAME, {
    ...transaction,
    pending: true,
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingTransactions() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function removePendingTransaction(id: number) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}

export async function syncPendingTransactions(syncFn: (transaction: Omit<Transaction, 'id'>) => Promise<void>) {
  const pending = await getPendingTransactions();
  
  for (const transaction of pending) {
    try {
      await syncFn(transaction);
      await removePendingTransaction(transaction.id);
    } catch (error) {
      console.error('Failed to sync transaction:', error);
    }
  }
}