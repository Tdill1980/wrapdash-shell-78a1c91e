/**
 * Sync service for offline-first architecture
 * Handles syncing local changes to server when online
 */
import { supabase } from '@/integrations/supabase/client';
import {
  getDB,
  getSyncQueue,
  removeSyncItem,
  incrementSyncRetry,
  cacheVehicles,
  cacheProducts,
  cacheCustomers,
  cacheOrders,
  setMeta,
  getMeta,
} from './db';

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30000; // 30 seconds

let syncInterval: NodeJS.Timeout | null = null;
let isOnline = navigator.onLine;

// Track online status
window.addEventListener('online', () => {
  isOnline = true;
  console.log('[Sync] Back online, starting sync...');
  syncPendingChanges();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('[Sync] Now offline');
});

export function isNetworkOnline(): boolean {
  return isOnline;
}

// Initial data sync from server to local
export async function syncFromServer(): Promise<void> {
  if (!isOnline) {
    console.log('[Sync] Offline, skipping server sync');
    return;
  }

  try {
    console.log('[Sync] Starting sync from server...');

    // Sync vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicle_dimensions')
      .select('*');
    
    if (vehiclesData) {
      const vehicles = vehiclesData.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: String(v.year_start || ''),
        sideWidth: v.side_width,
        sideHeight: v.side_height,
        sideSqFt: v.side_sqft,
        backWidth: v.back_width,
        backHeight: v.back_height,
        backSqFt: v.back_sqft,
        hoodWidth: v.hood_width,
        hoodLength: v.hood_length,
        hoodSqFt: v.hood_sqft,
        roofWidth: v.roof_width,
        roofLength: v.roof_length,
        roofSqFt: v.roof_sqft,
        totalSqFt: v.total_sqft,
        correctedSqFt: v.corrected_sqft,
        syncedAt: Date.now(),
      }));
      await cacheVehicles(vehicles);
      console.log(`[Sync] Cached ${vehicles.length} vehicles`);
    }

    // Sync products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (productsData) {
      const products = productsData.map(p => ({
        id: p.id,
        productName: p.product_name,
        pricePerSqft: p.price_per_sqft,
        flatPrice: p.flat_price,
        pricingType: p.pricing_type,
        category: p.category,
        description: p.description,
        isActive: p.is_active,
        displayOrder: p.display_order,
        syncedAt: Date.now(),
      }));
      await cacheProducts(products);
      console.log(`[Sync] Cached ${products.length} products`);
    }

    // Sync contacts/customers
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (contactsData) {
      const customers = contactsData.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        source: c.source,
        tags: c.tags || [],
        syncedAt: Date.now(),
      }));
      await cacheCustomers(customers);
      console.log(`[Sync] Cached ${customers.length} customers`);
    }

    // Sync orders - only paid orders
    const { data: ordersData } = await supabase
      .from('shopflow_orders')
      .select('*')
      .neq('hidden', true)
      .neq('is_paid', false)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (ordersData) {
      const orders = ordersData.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        productType: o.product_type,
        status: o.status,
        priority: o.priority,
        vehicleInfo: o.vehicle_info as Record<string, unknown> | null,
        timeline: o.timeline as Record<string, string> | null,
        createdAt: new Date(o.created_at || Date.now()).getTime(),
        syncedAt: Date.now(),
      }));
      await cacheOrders(orders);
      console.log(`[Sync] Cached ${orders.length} orders`);
    }

    await setMeta('lastSync', Date.now());
    console.log('[Sync] Server sync complete');
  } catch (error) {
    console.error('[Sync] Error syncing from server:', error);
  }
}

// Sync pending local changes to server
export async function syncPendingChanges(): Promise<void> {
  if (!isOnline) {
    console.log('[Sync] Offline, cannot sync pending changes');
    return;
  }

  const queue = await getSyncQueue();
  console.log(`[Sync] Processing ${queue.length} pending changes`);

  for (const item of queue) {
    if (item.retries >= MAX_RETRIES) {
      console.log(`[Sync] Skipping item ${item.id} after ${MAX_RETRIES} retries`);
      continue;
    }

    try {
      switch (item.table) {
        case 'quotes':
          await syncQuote(item);
          break;
        // Add other table handlers as needed
      }
      
      if (item.id) {
        await removeSyncItem(item.id);
      }
      console.log(`[Sync] Successfully synced ${item.table} ${item.action}`);
    } catch (error) {
      console.error(`[Sync] Error syncing ${item.table}:`, error);
      if (item.id) {
        await incrementSyncRetry(item.id);
      }
    }
  }
}

async function syncQuote(item: { action: string; data: Record<string, unknown> }) {
  const quote = item.data;
  
  if (item.action === 'create') {
    await supabase.from('quotes').insert([{
      quote_number: `Q-${Date.now()}`,
      customer_name: String(quote.customerName || ''),
      customer_email: quote.customerEmail ? String(quote.customerEmail) : null,
      vehicle_year: quote.vehicleYear ? String(quote.vehicleYear) : null,
      vehicle_make: quote.vehicleMake ? String(quote.vehicleMake) : null,
      vehicle_model: quote.vehicleModel ? String(quote.vehicleModel) : null,
      sqft: typeof quote.sqFt === 'number' ? quote.sqFt : null,
      total_price: typeof quote.totalPrice === 'number' ? quote.totalPrice : 0,
      status: String(quote.status || 'draft'),
    }]);
  } else if (item.action === 'update' && quote.id) {
    await supabase.from('quotes').update({
      customer_name: String(quote.customerName || ''),
      customer_email: quote.customerEmail ? String(quote.customerEmail) : null,
      vehicle_year: quote.vehicleYear ? String(quote.vehicleYear) : null,
      vehicle_make: quote.vehicleMake ? String(quote.vehicleMake) : null,
      vehicle_model: quote.vehicleModel ? String(quote.vehicleModel) : null,
      sqft: typeof quote.sqFt === 'number' ? quote.sqFt : null,
      total_price: typeof quote.totalPrice === 'number' ? quote.totalPrice : 0,
      status: String(quote.status || 'draft'),
    }).eq('id', String(quote.id));
  }
}

// Start background sync
export function startBackgroundSync(): void {
  if (syncInterval) return;
  
  syncInterval = setInterval(() => {
    if (isOnline) {
      syncPendingChanges();
    }
  }, SYNC_INTERVAL);
  
  console.log('[Sync] Background sync started');
}

export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Sync] Background sync stopped');
  }
}

// Get last sync time
export async function getLastSyncTime(): Promise<number | null> {
  const meta = await getMeta('lastSync');
  return meta?.value as number | null;
}
