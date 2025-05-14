/**
 * DOM Utility Functions
 * 
 * This file contains utility functions for DOM manipulation
 * and interaction. These functions help standardize common
 * DOM operations across the application.
 */

/**
 * Checks if the current environment is a browser
 * 
 * @returns True if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Gets an element by ID with type safety
 * 
 * @param id - The ID of the element to find
 * @returns The element or null if not found
 */
export function getElementById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  if (!isBrowser()) return null;
  return document.getElementById(id) as T | null;
}

/**
 * Gets elements by class name with type safety
 * 
 * @param className - The class name to search for
 * @param parent - Optional parent element to search within
 * @returns Array of matching elements
 */
export function getElementsByClassName<T extends HTMLElement = HTMLElement>(
  className: string,
  parent: HTMLElement | Document = document
): T[] {
  if (!isBrowser()) return [];
  return Array.from(parent.getElementsByClassName(className)) as T[];
}

/**
 * Checks if an element is visible in the viewport
 * 
 * @param element - The element to check
 * @param offset - Optional offset from viewport edges (in pixels)
 * @returns True if the element is visible in the viewport
 */
export function isElementInViewport(
  element: HTMLElement,
  offset: number = 0
): boolean {
  if (!isBrowser() || !element) return false;
  
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Smoothly scrolls to an element
 * 
 * @param element - The element to scroll to
 * @param options - Scroll options
 */
export function scrollToElement(
  element: HTMLElement | null,
  options: {
    behavior?: ScrollBehavior;
    offset?: number;
    align?: 'start' | 'center' | 'end';
  } = {}
): void {
  if (!isBrowser() || !element) return;
  
  const { behavior = 'smooth', offset = 0, align = 'start' } = options;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior
  });
  
  // If browser supports scrollIntoView with options, use it for more control
  if ('scrollBehavior' in document.documentElement.style) {
    element.scrollIntoView({
      behavior,
      block: align,
      inline: 'nearest'
    });
  }
}

/**
 * Creates a new HTML element with specified attributes
 * 
 * @param tagName - The type of element to create
 * @param attributes - Optional attributes to set on the element
 * @param textContent - Optional text content for the element
 * @returns The created element
 */
export function createElement<T extends HTMLElement = HTMLElement>(
  tagName: string,
  attributes: Record<string, string> = {},
  textContent?: string
): T {
  if (!isBrowser()) {
    throw new Error('createElement cannot be called outside of a browser environment');
  }
  
  const element = document.createElement(tagName) as T;
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  // Set text content if provided
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  
  return element;
}

/**
 * Adds or removes a class based on a condition
 * 
 * @param element - The element to modify
 * @param className - The class name to toggle
 * @param condition - Whether to add or remove the class
 */
export function toggleClass(
  element: HTMLElement,
  className: string,
  condition: boolean
): void {
  if (!element) return;
  
  if (condition) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * Gets the scroll position of the page
 * 
 * @returns Object containing x and y scroll positions
 */
export function getScrollPosition(): { x: number; y: number } {
  if (!isBrowser()) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
}

/**
 * Checks if an element has a specific attribute
 * 
 * @param element - The element to check
 * @param attributeName - The name of the attribute to check for
 * @returns True if the element has the attribute
 */
export function hasAttribute(
  element: HTMLElement | null,
  attributeName: string
): boolean {
  return element ? element.hasAttribute(attributeName) : false;
}

/**
 * Gets all form field values as an object
 * 
 * @param form - The form element
 * @returns Object containing all form field values
 */
export function getFormValues(form: HTMLFormElement): Record<string, string | string[]> {
  if (!form) return {};
  
  const formData = new FormData(form);
  const values: Record<string, string | string[]> = {};
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      // Check if this is a multi-value field (like checkboxes)
      if (values[key]) {
        if (Array.isArray(values[key])) {
          (values[key] as string[]).push(value);
        } else {
          values[key] = [values[key] as string, value];
        }
      } else {
        values[key] = value;
      }
    }
  }
  
  return values;
}

/**
 * Gets the dimensions of an element
 * 
 * @param element - The element to measure
 * @returns Object containing width, height, top, left, right, and bottom
 */
export function getElementDimensions(element: HTMLElement): DOMRect | null {
  if (!element) return null;
  return element.getBoundingClientRect();
}

/**
 * Disables all interactive elements within a container
 * 
 * @param container - The container element
 * @returns Function to re-enable the elements
 */
export function disableInteractiveElements(container: HTMLElement): () => void {
  if (!container) return () => {};
  
  const elements = container.querySelectorAll<HTMLElement>(
    'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
  );
  
  const originalState: Array<{ element: HTMLElement; tabIndex: number; disabled: boolean }> = [];
  
  elements.forEach(element => {
    // Store original state
    originalState.push({
      element,
      tabIndex: element.tabIndex,
      disabled: element.hasAttribute('disabled')
    });
    
    // Disable element
    element.tabIndex = -1;
    
    // For form elements
    if ('disabled' in element) {
      (element as HTMLInputElement).disabled = true;
    }
    
    // For other elements
    element.setAttribute('aria-disabled', 'true');
  });
  
  // Return function to restore original state
  return () => {
    originalState.forEach(({ element, tabIndex, disabled }) => {
      element.tabIndex = tabIndex;
      
      if ('disabled' in element) {
        (element as HTMLInputElement).disabled = disabled;
      }
      
      if (!disabled) {
        element.removeAttribute('aria-disabled');
      }
    });
  };
}

/**
 * Sets multiple CSS properties on an element
 * 
 * @param element - The element to style
 * @param styles - Object containing CSS properties and values
 */
export function setStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  if (!element) return;
  
  Object.entries(styles).forEach(([property, value]) => {
    if (property in element.style) {
      element.style[property as any] = value as string;
    }
  });
}

/**
 * Checks if an element is a descendant of another element
 * 
 * @param child - The potential child element
 * @param parent - The potential parent element
 * @returns True if child is a descendant of parent
 */
export function isDescendant(
  child: HTMLElement | null,
  parent: HTMLElement | null
): boolean {
  if (!child || !parent) return false;
  
  let node = child.parentNode;
  
  while (node) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  
  return false;
}

/**
 * Adds event listeners to multiple elements
 * 
 * @param elements - Array of elements to add listeners to
 * @param event - Event type to listen for
 * @param handler - Event handler function
 * @param options - Event listener options
 * @returns Function to remove all event listeners
 */
export function addEventListeners<K extends keyof HTMLElementEventMap>(
  elements: HTMLElement[],
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void {
  if (!elements || !elements.length) return () => {};
  
  elements.forEach(element => {
    element.addEventListener(event, handler as EventListener, options);
  });
  
  return () => {
    elements.forEach(element => {
      element.removeEventListener(event, handler as EventListener, options);
    });
  };
}