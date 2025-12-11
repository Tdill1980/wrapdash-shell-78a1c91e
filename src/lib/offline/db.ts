/**
 * IndexedDB wrapper for offline data storage
 * Provides offline-first data layer with sync capabilities
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface WrapCommandDB extends DBSchema {
  vehicles: {
    key: string;
    value: {
      id: string;
      make: string;
      model: string;
      year: string;
      sideWidth: number | null;
      sideHeight: number | null;
      sideSqFt: number | null;
      backWidth: number | null;
      backHeight: number | null;
      backSqFt: number | null;
      hoodWidth: number | null;
      hoodLength: number | null;
      hoodSqFt: number | null;
      roofWidth: number | null;
      roofLength: number | null;
      roofSqFt: number | null;
      totalSqFt: number | null;
      correctedSqFt: number | null;
      syncedAt: number;
    };
    indexes: { 'by-make': string; 'by-make-model': [string, string] };
  };
  products: {
    key: string;
    value: {
      id: string;
      productName: string;
      pricePerSqft: number | null;
      flatPrice: number | null;
      pricingType: string;
      category: string;
      description: string | null;
      isActive: boolean;
      displayOrder: number;
      syncedAt: number;
    };
    indexes: { 'by-category': string };
  };
  customers: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      source: string | null;
      tags: string[];
      syncedAt: number;
    };
    indexes: { 'by-email': string; 'by-name': string };
  };
  quotes: {
    key: string;
    value: {
      id: string;
      customerName: string;
      customerEmail: string | null;
      vehicleYear: string | null;
      vehicleMake: string | null;
      vehicleModel: string | null;
      sqFt: number | null;
      productId: string | null;
      productName: string | null;
      totalPrice: number | null;
      status: string;
      createdAt: number;
      updatedAt: number;
      syncedAt: number;
      pendingSync: boolean;
    };
    indexes: { 'by-status': string; 'by-pending': number };
  };
  orders: {
    key: string;
    value: {
      id: string;
      orderNumber: string;
      customerName: string;
      customerEmail: string | null;
      productType: string | null;
      status: string;
      priority: string;
      vehicleInfo: Record<string, unknown> | null;
      timeline: Record<string, string> | null;
      createdAt: number;
      syncedAt: number;
    };
    indexes: { 'by-status': string; 'by-order-number': string };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      table: string;
      action: 'create' | 'update' | 'delete';
      data: Record<string, unknown>;
      createdAt: number;
      retries: number;
    };
  };
  meta: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<WrapCommandDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<WrapCommandDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WrapCommandDB>('wrapcommand-offline', 1, {
    upgrade(db) {
      // Vehicles store
      const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
      vehicleStore.createIndex('by-make', 'make');
      vehicleStore.createIndex('by-make-model', ['make', 'model']);

      // Products store
      const productStore = db.createObjectStore('products', { keyPath: 'id' });
      productStore.createIndex('by-category', 'category');

      // Customers store
      const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
      customerStore.createIndex('by-email', 'email');
      customerStore.createIndex('by-name', 'name');

      // Quotes store
      const quoteStore = db.createObjectStore('quotes', { keyPath: 'id' });
      quoteStore.createIndex('by-status', 'status');
      quoteStore.createIndex('by-pending', 'pendingSync');

      // Orders store
      const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
      orderStore.createIndex('by-status', 'status');
      orderStore.createIndex('by-order-number', 'orderNumber');

      // Sync queue for offline changes
      db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });

      // Meta store for sync timestamps
      db.createObjectStore('meta', { keyPath: 'key' });
    },
  });

  return dbInstance;
}

// Vehicle operations
export async function cacheVehicles(vehicles: WrapCommandDB['vehicles']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('vehicles', 'readwrite');
  await Promise.all(vehicles.map(v => tx.store.put(v)));
  await tx.done;
}

export async function getVehicleMakes(): Promise<string[]> {
  const db = await getDB();
  const vehicles = await db.getAll('vehicles');
  const makes = [...new Set(vehicles.map(v => v.make))].sort();
  return makes;
}

export async function getVehicleModels(make: string): Promise<string[]> {
  const db = await getDB();
  const vehicles = await db.getAllFromIndex('vehicles', 'by-make', make);
  const models = [...new Set(vehicles.map(v => v.model))].sort();
  return models;
}

export async function getVehicleYears(make: string, model: string): Promise<string[]> {
  const db = await getDB();
  const vehicles = await db.getAllFromIndex('vehicles', 'by-make-model', [make, model]);
  return vehicles.map(v => v.year).sort();
}

export async function getVehicleDimensions(make: string, model: string, year: string) {
  const db = await getDB();
  const vehicles = await db.getAllFromIndex('vehicles', 'by-make-model', [make, model]);
  return vehicles.find(v => v.year === year) || vehicles[0];
}

// Product operations
export async function cacheProducts(products: WrapCommandDB['products']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  await Promise.all(products.map(p => tx.store.put(p)));
  await tx.done;
}

export async function getProducts() {
  const db = await getDB();
  return db.getAll('products');
}

export async function getProductsByCategory(category: string) {
  const db = await getDB();
  return db.getAllFromIndex('products', 'by-category', category);
}

// Customer operations
export async function cacheCustomers(customers: WrapCommandDB['customers']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('customers', 'readwrite');
  await Promise.all(customers.map(c => tx.store.put(c)));
  await tx.done;
}

export async function getCustomers() {
  const db = await getDB();
  return db.getAll('customers');
}

export async function searchCustomers(query: string) {
  const db = await getDB();
  const all = await db.getAll('customers');
  const q = query.toLowerCase();
  return all.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.email?.toLowerCase().includes(q) ||
    c.company?.toLowerCase().includes(q)
  );
}

// Quote operations (offline-first with sync)
export async function saveQuoteOffline(quote: WrapCommandDB['quotes']['value']) {
  const db = await getDB();
  await db.put('quotes', { ...quote, pendingSync: true, updatedAt: Date.now() });
  
  // Add to sync queue
  await db.add('syncQueue', {
    table: 'quotes',
    action: quote.syncedAt ? 'update' : 'create',
    data: quote,
    createdAt: Date.now(),
    retries: 0,
  });
}

export async function getQuotes() {
  const db = await getDB();
  return db.getAll('quotes');
}

export async function getQuotesByStatus(status: string) {
  const db = await getDB();
  return db.getAllFromIndex('quotes', 'by-status', status);
}

export async function getPendingQuotes() {
  const db = await getDB();
  const all = await db.getAll('quotes');
  return all.filter(q => q.pendingSync);
}

// Order operations
export async function cacheOrders(orders: WrapCommandDB['orders']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('orders', 'readwrite');
  await Promise.all(orders.map(o => tx.store.put(o)));
  await tx.done;
}

export async function getOrders() {
  const db = await getDB();
  return db.getAll('orders');
}

export async function getOrdersByStatus(status: string) {
  const db = await getDB();
  return db.getAllFromIndex('orders', 'by-status', status);
}

// Sync queue operations
export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function removeSyncItem(id: number) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function incrementSyncRetry(id: number) {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    await db.put('syncQueue', { ...item, retries: item.retries + 1 });
  }
}

// Meta operations
export async function setMeta(key: string, value: unknown) {
  const db = await getDB();
  await db.put('meta', { key, value, updatedAt: Date.now() });
}

export async function getMeta(key: string) {
  const db = await getDB();
  return db.get('meta', key);
}

// Clear all data
export async function clearAllData() {
  const db = await getDB();
  await db.clear('vehicles');
  await db.clear('products');
  await db.clear('customers');
  await db.clear('quotes');
  await db.clear('orders');
  await db.clear('syncQueue');
  await db.clear('meta');
}
