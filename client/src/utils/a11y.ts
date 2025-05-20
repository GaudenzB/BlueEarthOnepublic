/**
 * Accessibility (a11y) Utility Functions
 * 
 * This module contains utility functions for improving accessibility.
 * These functions help make the application more usable for people with disabilities.
 */

/**
 * ARIA roles for common UI elements
 */
export const ariaRoles = {
  button: 'button',
  link: 'link',
  checkbox: 'checkbox',
  radio: 'radio',
  tab: 'tab',
  tablist: 'tablist',
  tabpanel: 'tabpanel',
  dialog: 'dialog',
  alertdialog: 'alertdialog',
  navigation: 'navigation',
  menu: 'menu',
  menuitem: 'menuitem',
  menubar: 'menubar',
  tooltip: 'tooltip',
  search: 'search',
  searchbox: 'searchbox',
  status: 'status',
  alert: 'alert',
  progressbar: 'progressbar',
  slider: 'slider',
  listbox: 'listbox',
  option: 'option',
  combobox: 'combobox',
  grid: 'grid',
  row: 'row',
  cell: 'cell',
  columnheader: 'columnheader',
  rowheader: 'rowheader',
  separator: 'separator',
  article: 'article',
  document: 'document',
  application: 'application',
  banner: 'banner',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  form: 'form',
  main: 'main',
  region: 'region',
  group: 'group',
};

/**
 * Check if element can receive focus
 */
export function canFocus(element: HTMLElement): boolean {
  const focusableElements = [
    'a',
    'button',
    'input',
    'textarea',
    'select',
    'details',
    '[tabindex]',
  ];
  
  const selector = focusableElements.join(', ');
  
  if (element.matches(selector)) {
    return !element.hasAttribute('disabled') && 
      !element.hasAttribute('aria-disabled') &&
      (
        element.getAttribute('tabindex') !== '-1' ||
        element.nodeName.toLowerCase() === 'a' ||
        element.nodeName.toLowerCase() === 'button' ||
        element.nodeName.toLowerCase() === 'input' ||
        element.nodeName.toLowerCase() === 'textarea' ||
        element.nodeName.toLowerCase() === 'select'
      );
  }
  
  return false;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableElements = [
    'a[href]:not([disabled]):not([aria-disabled="true"])',
    'button:not([disabled]):not([aria-disabled="true"])',
    'input:not([disabled]):not([aria-disabled="true"])',
    'select:not([disabled]):not([aria-disabled="true"])',
    'textarea:not([disabled]):not([aria-disabled="true"])',
    'details:not([disabled]):not([aria-disabled="true"])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  
  const elements = Array.from(
    container.querySelectorAll(focusableElements.join(', '))
  ) as HTMLElement[];
  
  return elements.filter(element => element.offsetParent !== null);
}

/**
 * Trap focus within a container (modal dialog, etc.)
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;
  
  // Since we've already checked focusableElements.length above, these are safe to use
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.shiftKey && document.activeElement === firstElement) {
    // When on the first element and going backward, wrap to the last element
    lastElement.focus();
    event.preventDefault();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    // When on the last element and going forward, wrap to the first element
    firstElement.focus();
    event.preventDefault();
  }
}

/**
 * Set up focus trap and remove it when done
 */
export function setupFocusTrap(container: HTMLElement): () => void {
  const keydownHandler = (event: KeyboardEvent) => trapFocus(container, event);
  
  document.addEventListener('keydown', keydownHandler);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', keydownHandler);
  };
}

/**
 * Focus first focusable element in container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);
  // Check if the array has elements before accessing
  if (focusableElements.length > 0) {
    // Since we've checked length, we know this element exists
    focusableElements[0].focus();
  }
}

/**
 * Create an accessible announcement
 */
export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  let announcer = document.getElementById('a11y-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    
    // Create both politeness levels
    const politeRegion = document.createElement('div');
    politeRegion.id = 'a11y-announcer-polite';
    politeRegion.setAttribute('aria-live', 'polite');
    
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'a11y-announcer-assertive';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    
    announcer.appendChild(politeRegion);
    announcer.appendChild(assertiveRegion);
    document.body.appendChild(announcer);
  }
  
  const region = document.getElementById(`a11y-announcer-${politeness}`);
  if (region) {
    region.textContent = message;
    
    // Clear after a short delay to allow for repeat announcements
    setTimeout(() => {
      region.textContent = '';
    }, 500);
  }
}

/**
 * Check if high contrast mode is enabled
 */
export function isHighContrastMode(): boolean {
  // This is a basic detection and may not work in all browsers
  const highContrastMedia = window.matchMedia('(forced-colors: active)');
  return highContrastMedia.matches;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Generate random ID for ARIA attributes
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.floor(Math.random() * 10000000)}`;
}

/**
 * Generate random ID for any element
 * @alias of generateAriaId
 */
export function generateId(prefix: string = 'id'): string {
  return generateAriaId(prefix);
}

/**
 * Create accessible ID for components
 * @alias of generateAriaId
 */
export function createAccessibleId(prefix: string = 'id'): string {
  return generateAriaId(prefix);
}

/**
 * Check if screen reader is potentially being used
 * Note: This is not 100% reliable and should only be used for enhanced features
 */
export function isPotentialScreenReaderUser(): boolean {
  return (
    // Check for common screen reader detection flags
    'speechSynthesis' in window ||
    // @ts-ignore - These properties might not exist in all browsers
    !!document.documentElement.getAttribute('data-at-detected') ||
    // @ts-ignore
    !!window.onvoiceschanged
  );
}

/**
 * Get CSS for screen reader only elements
 */
export function srOnlyStyles(): Record<string, string> {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  };
}

export default {
  ariaRoles,
  canFocus,
  getFocusableElements,
  trapFocus,
  setupFocusTrap,
  focusFirstElement,
  announce,
  isHighContrastMode,
  prefersReducedMotion,
  generateAriaId,
  isPotentialScreenReaderUser,
  srOnlyStyles,
};