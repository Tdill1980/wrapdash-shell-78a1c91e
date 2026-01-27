

# Update Favicon and Sidebar Logo to New WrapCommand AI Logo

## Overview

Replace the current favicon and sidebar logo with the new WrapCommand AI logo (cyber car with circuit board design) that the user has uploaded.

---

## Files to Update

| File | Change |
|------|--------|
| `public/favicon.ico` | Replace with new logo (converted to ICO format or use PNG) |
| `public/pwa-192x192.png` | Replace with new logo at 192x192 |
| `public/pwa-512x512.png` | Replace with new logo at 512x512 |
| `src/assets/wrapcommand-logo-new.png` | Replace with new logo (used by Sidebar and TopBar) |
| `index.html` | Add explicit favicon link tag pointing to the new favicon |

---

## Implementation Steps

### Step 1: Copy Uploaded Logo to Project

Copy the new logo to the appropriate locations:

```text
user-uploads://android-chrome-512x512.png → public/pwa-512x512.png   (PWA icon)
user-uploads://android-chrome-512x512.png → public/favicon.png       (Favicon as PNG)
user-uploads://android-chrome-512x512.png → src/assets/wrapcommand-logo-new.png (Sidebar/TopBar)
```

### Step 2: Update index.html

Add an explicit favicon link tag to ensure browsers pick up the new favicon:

```html
<!-- Add inside <head> section -->
<link rel="icon" type="image/png" href="/favicon.png" />
```

### Step 3: Generate 192x192 PWA Icon

The uploaded image is 512x512. For the 192x192 PWA icon, I'll copy the same file - modern browsers will handle the scaling, or we can note that a properly resized version should be created for optimal quality.

### Step 4: Update vite.config.ts (if needed)

The current config references `favicon.ico` - update to use `favicon.png`:

```typescript
includeAssets: ["favicon.png", "pwa-192x192.png", "pwa-512x512.png"],
```

---

## Files Affected

### 1. Copy Operations
- `user-uploads://android-chrome-512x512.png` → `public/favicon.png`
- `user-uploads://android-chrome-512x512.png` → `public/pwa-512x512.png`
- `user-uploads://android-chrome-512x512.png` → `public/pwa-192x192.png`
- `user-uploads://android-chrome-512x512.png` → `src/assets/wrapcommand-logo-new.png`

### 2. index.html
Add favicon link tag to `<head>` section

### 3. vite.config.ts
Update `includeAssets` to reference `favicon.png` instead of `favicon.ico`

---

## Result

After implementation:
- **Browser tab** will show the new WrapCommand AI cyber car logo as favicon
- **Sidebar** (above navigation) will display the new logo
- **TopBar** (mobile/header) will display the new logo
- **PWA** (when installed) will use the new logo as app icon
- **Apple touch icon** will use the new 192x192 logo

