import { toast } from "sonner";

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
