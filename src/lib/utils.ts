import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function downloadFromUrl(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback to opening in new tab if programmatic download fails
    window.open(url, '_blank');
  }
}

export function formatSafeFileName(userName: string, docType: string, originalFileName: string) {
  const parts = originalFileName.split('.');
  const extension = parts.length > 1 ? parts.pop() : '';
  const sanitizedUserName = userName.trim().replace(/\s+/g, '_').toLowerCase();
  const sanitizedDocType = docType.trim().replace(/\s+/g, '_').toLowerCase();
  return `${sanitizedUserName}-${sanitizedDocType}${extension ? '.' + extension : ''}`;
}

export function getFileExtension(filename: string) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}
