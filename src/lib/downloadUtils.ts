import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Download a file from URL - opens in new tab for video/large files
 */
export function downloadFromUrl(url: string, filename?: string): void {
  if (!url) {
    toast.error("No download URL available");
    return;
  }
  
  // For external URLs, open in new tab
  window.open(url, "_blank");
}

/**
 * Download a file properly to device using fetch + blob
 * Best for images and smaller files
 */
export async function downloadToDevice(url: string, filename: string): Promise<void> {
  if (!url) {
    toast.error("No download URL available");
    return;
  }

  try {
    // For base64 data URLs
    if (url.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloaded!");
      return;
    }

    // For regular URLs, fetch and create blob
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file");
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(blobUrl);
    toast.success("Downloaded!");
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback to opening in new tab
    window.open(url, "_blank");
    toast.info("Opened in new tab - right-click to save");
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string, successMessage = "Copied!"): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    toast.error("Failed to copy");
    return false;
  }
}

/**
 * Download JSON as file
 */
export function downloadAsJson(data: object, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  toast.success("Downloaded!");
}

/**
 * Generate a download filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

// ============= Batch ZIP Export =============

export interface DownloadItem {
  url: string;
  filename: string;
  folder?: string; // e.g., "2025-01-20/WrapDash/instagram"
}

/**
 * Download multiple files as a ZIP archive
 * Organizes files into folders based on the folder property
 */
export async function downloadAsZip(
  items: DownloadItem[],
  zipFilename: string,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (items.length === 0) {
    toast.error("No files to download");
    return;
  }

  const zip = new JSZip();
  let completed = 0;
  let failed = 0;

  // Fetch all files and add to ZIP
  const promises = items.map(async (item) => {
    try {
      const response = await fetch(item.url);
      if (!response.ok) throw new Error(`Failed to fetch ${item.url}`);

      const blob = await response.blob();
      const path = item.folder
        ? `${item.folder}/${item.filename}`
        : item.filename;

      zip.file(path, blob);
      completed++;
      onProgress?.(completed, items.length);
    } catch (error) {
      console.error(`Failed to add ${item.filename}:`, error);
      failed++;
    }
  });

  await Promise.all(promises);

  if (completed === 0) {
    toast.error("Failed to download any files");
    return;
  }

  // Generate and download ZIP
  const content = await zip.generateAsync({ 
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  
  saveAs(content, zipFilename);

  if (failed > 0) {
    toast.warning(`Downloaded ${completed} files, ${failed} failed`);
  } else {
    toast.success(`Downloaded ${completed} files!`);
  }
}

// ============= Helper Functions for ZIP =============

/**
 * Sanitize folder name for filesystem
 */
export function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "Unknown";
}

/**
 * Sanitize filename for filesystem
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "_").slice(0, 50);
}

/**
 * Extract file extension from URL
 */
export function getExtensionFromUrl(url: string): string {
  const match = url.match(/\.(mp4|mov|webm|jpg|jpeg|png|gif|webp)(\?|$)/i);
  return match ? `.${match[1].toLowerCase()}` : ".mp4";
}
