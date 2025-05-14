/**
 * DOM Utility Functions
 * 
 * This file contains utility functions for DOM manipulation and browser interactions.
 * These can be used across the application for consistent behavior.
 */

/**
 * Smoothly scrolls to an element with a specified offset
 * 
 * @param elementId - ID of the element to scroll to
 * @param offset - Offset from the top (default: 0)
 * @param behavior - Scroll behavior (default: smooth)
 */
export function scrollToElement(
  elementId: string,
  offset = 0,
  behavior: ScrollBehavior = 'smooth'
): void {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn(`Element with ID "${elementId}" not found for scrolling`);
    return;
  }
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior
  });
}

/**
 * Copy text to clipboard with fallback for older browsers
 * 
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern approach using Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Detects if the device is a mobile device
 * 
 * @returns True if the device is mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  // Use regex to check common mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent);
}

/**
 * Creates a downloadable file from data
 * 
 * @param filename - Name of the file to download
 * @param data - File content (string or Blob)
 * @param type - MIME type (default: text/plain)
 */
export function downloadFile(
  filename: string,
  data: string | Blob,
  type = 'text/plain'
): void {
  // Create blob if data is string
  const blob = typeof data === 'string' 
    ? new Blob([data], { type }) 
    : data;
  
  // Create download URL
  const url = URL.createObjectURL(blob);
  
  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Adds or removes a class to the document body
 * 
 * @param className - Class to toggle
 * @param force - If true, adds the class; if false, removes it
 */
export function toggleBodyClass(className: string, force?: boolean): void {
  if (force === undefined) {
    document.body.classList.toggle(className);
  } else if (force) {
    document.body.classList.add(className);
  } else {
    document.body.classList.remove(className);
  }
}

/**
 * Gets the current viewport dimensions
 * 
 * @returns Object with viewport width and height
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  };
}

/**
 * Focus trap utility for modal dialogs
 * Trap focus within a specified element (for accessibility)
 * 
 * @param containerElement - Element to trap focus within
 * @returns Function to remove the focus trap
 */
export function createFocusTrap(containerElement: HTMLElement): () => void {
  // Identify all focusable elements within the container
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return () => {}; // No focusable elements
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  // Focus first element
  firstElement.focus();
  
  // Handle tab key to create the loop
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    // Shift + Tab
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } 
    // Tab
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  // Add event listener
  document.addEventListener('keydown', handleKeyDown);
  
  // Return function that removes the focus trap
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}