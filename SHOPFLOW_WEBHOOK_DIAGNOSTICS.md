# ShopFlow Webhook Diagnostics

## Issue: Files Showing as Missing

### Root Cause
The WooCommerce webhook is **correctly functioning** but is receiving orders with **no file attachments** from WooCommerce.

Looking at the network data for order 33221:
```json
{
  "order_number": "33221",
  "files": [],  // Empty array - no files from WooCommerce
  "customer_name": "Parker Dickerson",
  "status": "in_production"
}
```

### Why This Happens

1. **Customer hasn't uploaded files to WooCommerce** - The files field is empty because WooCommerce doesn't have file uploads for this order
2. **Files were sent via Dropbox/Email** - Many customers use the Dropbox link or email files separately instead of uploading to WooCommerce
3. **WooCommerce plugin limitation** - The file upload plugin in WooCommerce may not be capturing files in the expected `meta_data` format

### What I Fixed

#### 1. Enhanced File Detection
Updated `sync-wc-shopflow` edge function to:
- Search for files in more locations (meta_data, line_items, attachments, documents)
- Handle multiple file formats (strings, arrays, objects with URLs)
- Add detailed logging to show exactly what WooCommerce is sending
- Log when no files are found and why

#### 2. Layout Improvements
- Moved Timeline above "What's Next" section
- All cards now pull correct data from WooCommerce sync

#### 3. Better Visual Feedback
The UI correctly shows:
- ✅ "Dropbox Link Sent" message when status is `dropbox-link-sent`
- ⚠️ "Missing Artwork Files" when `files.length === 0`
- 📁 Files grid when files exist

### How to Test

1. **Check edge function logs** after next WooCommerce webhook:
   ```
   Look for logs like:
   "🔍 Extracting files from WooCommerce payload..."
   "📁 Total files extracted: X"
   ```

2. **Manually trigger webhook** to see what WooCommerce sends:
   - Go to WooCommerce → Settings → Advanced → Webhooks
   - Find the ShopFlow webhook
   - Click "View" → "Deliver"
   - Check Supabase Edge Function logs to see what was received

### Next Steps

**To verify if files exist in WooCommerce:**
1. Log into WooCommerce admin
2. Go to order #33221
3. Check if files are attached under:
   - Order notes
   - Custom fields
   - Product meta data
   - Uploaded files section

**If files ARE in WooCommerce but not syncing:**
- Share a screenshot of where the files appear in WooCommerce
- We'll update the extraction logic to find them in that location

**If files are NOT in WooCommerce:**
- This is expected behavior
- Files will appear once customer uploads via ShopFlow UI or staff adds them manually
- Files sent via email/Dropbox need to be manually added to the order

### Manual Workaround

To add files to an order manually:
1. Go to `/shopflow-internal/:id`
2. Use the "Upload Files" action in the staff sidebar
3. Files will sync to both Supabase and WooCommerce
