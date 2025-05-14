/**
 * DOM manipulation utilities
 * 
 * These utility functions handle common DOM operations with better
 * type safety, error handling, and browser compatibility.
 */

/**
 * Adds a class to an element if it doesn't already have it
 * 
 * @param element - DOM element to add class to
 * @param className - Class name to add
 */
export function addClass(element: HTMLElement, className: string): void {
  if (!element) return;
  if (!element.classList.contains(className)) {
    element.classList.add(className);
  }
}

/**
 * Removes a class from an element
 * 
 * @param element - DOM element to remove class from
 * @param className - Class name to remove
 */
export function removeClass(element: HTMLElement, className: string): void {
  if (!element) return;
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

/**
 * Toggles a class on an element
 * 
 * @param element - DOM element to toggle class on
 * @param className - Class name to toggle
 * @param force - If true, adds class; if false, removes class (optional)
 */
export function toggleClass(
  element: HTMLElement, 
  className: string,
  force?: boolean
): void {
  if (!element) return;
  if (force !== undefined) {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

/**
 * Checks if an element has a specific class
 * 
 * @param element - DOM element to check
 * @param className - Class name to check for
 * @returns True if element has the class, false otherwise
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  if (!element) return false;
  return element.classList.contains(className);
}

/**
 * Returns the closest ancestor of an element that matches a selector
 * 
 * @param element - DOM element to start from
 * @param selector - CSS selector to match ancestors against
 * @returns The matching ancestor element, or null if none found
 */
export function closest(
  element: HTMLElement, 
  selector: string
): HTMLElement | null {
  if (!element) return null;
  
  // Use native Element.closest() if available
  if (element.closest) {
    return element.closest(selector) as HTMLElement;
  }
  
  // Fallback for older browsers
  let currentElement: HTMLElement | null = element;
  
  while (currentElement) {
    if (matches(currentElement, selector)) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  
  return null;
}

/**
 * Checks if an element matches a CSS selector
 * 
 * @param element - DOM element to check
 * @param selector - CSS selector to match against
 * @returns True if element matches the selector, false otherwise
 */
export function matches(element: HTMLElement, selector: string): boolean {
  if (!element) return false;
  
  // Use native matches or vendor-prefixed versions
  const matchesMethod = element.matches || 
                         (element as any).msMatchesSelector || 
                         (element as any).webkitMatchesSelector;
  
  if (matchesMethod) {
    return matchesMethod.call(element, selector);
  }
  
  // Fallback for older browsers
  const allElements = Array.from(document.querySelectorAll(selector));
  return allElements.includes(element);
}

/**
 * Gets the position of an element relative to the document
 * 
 * @param element - DOM element to get position of
 * @returns Object with left and top coordinates
 */
export function getOffset(element: HTMLElement): { left: number; top: number } {
  if (!element) return { left: 0, top: 0 };
  
  const rect = element.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  return {
    left: rect.left + scrollLeft,
    top: rect.top + scrollTop
  };
}

/**
 * Gets the computed style value for a CSS property
 * 
 * @param element - DOM element to get style from
 * @param property - CSS property to get
 * @returns Computed style value
 */
export function getStyle(element: HTMLElement, property: string): string {
  if (!element) return '';
  
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.getPropertyValue(property);
}

/**
 * Sets CSS styles on an element
 * 
 * @param element - DOM element to apply styles to
 * @param styles - Object with CSS properties and values
 */
export function setStyles(
  element: HTMLElement,
  styles: Record<string, string | number>
): void {
  if (!element) return;
  
  Object.entries(styles).forEach(([property, value]) => {
    // Convert camelCase to kebab-case if needed
    const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    // Convert numbers to pixel values for certain properties
    const stringValue = typeof value === 'number' && 
      !property.includes('opacity') && 
      !property.includes('zIndex') && 
      !property.includes('flex') &&
      !property.includes('fontWeight') &&
      !property.includes('lineHeight')
        ? `${value}px`
        : value.toString();
    
    element.style.setProperty(kebabProperty, stringValue);
  });
}

/**
 * Inserts an element after another element
 * 
 * @param newElement - Element to insert
 * @param referenceElement - Element to insert after
 */
export function insertAfter(
  newElement: HTMLElement,
  referenceElement: HTMLElement
): void {
  if (!newElement || !referenceElement || !referenceElement.parentNode) return;
  
  referenceElement.parentNode.insertBefore(
    newElement,
    referenceElement.nextSibling
  );
}

/**
 * Creates a DOM element with attributes and content
 * 
 * @param tagName - HTML tag name
 * @param attributes - Object of HTML attributes to set
 * @param content - Inner HTML content or child nodes
 * @returns The created DOM element
 */
export function createElement<T extends HTMLElement>(
  tagName: string,
  attributes: Record<string, string | boolean | number> = {},
  content?: string | Node | Array<Node>
): T {
  const element = document.createElement(tagName) as T;
  
  // Set attributes
  Object.entries(attributes).forEach(([attr, value]) => {
    // Convert boolean attributes
    if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(attr, '');
      }
    } else {
      element.setAttribute(attr, value.toString());
    }
  });
  
  // Add content
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof Node) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(node => {
        if (node instanceof Node) {
          element.appendChild(node);
        }
      });
    }
  }
  
  return element;
}

/**
 * Removes all child nodes from an element
 * 
 * @param element - Element to empty
 */
export function empty(element: HTMLElement): void {
  if (!element) return;
  
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Gets all siblings of an element
 * 
 * @param element - Element to get siblings of
 * @returns Array of sibling elements
 */
export function getSiblings(element: HTMLElement): HTMLElement[] {
  if (!element || !element.parentNode) return [];
  
  return Array.from(element.parentNode.children)
    .filter(child => child !== element) as HTMLElement[];
}

/**
 * Gets the next sibling element that matches a selector
 * 
 * @param element - Element to start from
 * @param selector - CSS selector to match
 * @returns Next matching sibling, or null if none found
 */
export function getNextSibling(
  element: HTMLElement,
  selector?: string
): HTMLElement | null {
  if (!element) return null;
  
  let sibling = element.nextElementSibling as HTMLElement;
  
  if (!selector) {
    return sibling;
  }
  
  while (sibling) {
    if (matches(sibling, selector)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling as HTMLElement;
  }
  
  return null;
}

/**
 * Gets the previous sibling element that matches a selector
 * 
 * @param element - Element to start from
 * @param selector - CSS selector to match
 * @returns Previous matching sibling, or null if none found
 */
export function getPreviousSibling(
  element: HTMLElement,
  selector?: string
): HTMLElement | null {
  if (!element) return null;
  
  let sibling = element.previousElementSibling as HTMLElement;
  
  if (!selector) {
    return sibling;
  }
  
  while (sibling) {
    if (matches(sibling, selector)) {
      return sibling;
    }
    sibling = sibling.previousElementSibling as HTMLElement;
  }
  
  return null;
}

/**
 * Scrolls an element into view smoothly
 * 
 * @param element - Element to scroll to
 * @param options - ScrollIntoView options
 */
export function scrollIntoView(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }
): void {
  if (!element) return;
  element.scrollIntoView(options);
}

/**
 * Gets the document's scroll position
 * 
 * @returns Object with scrollLeft and scrollTop values
 */
export function getScrollPosition(): { scrollLeft: number; scrollTop: number } {
  return {
    scrollLeft: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    scrollTop: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  };
}

/**
 * Detects if an element is in the viewport
 * 
 * @param element - Element to check
 * @param offset - Optional offset from viewport edges (default: 0)
 * @returns Whether the element is in the viewport
 */
export function isInViewport(
  element: HTMLElement,
  offset: number = 0
): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Gets or sets the text content of an element
 * 
 * @param element - Element to get/set text content of
 * @param text - Text content to set (optional)
 * @returns Current text content if no text parameter provided
 */
export function text(
  element: HTMLElement,
  text?: string
): string | undefined {
  if (!element) return undefined;
  
  if (text === undefined) {
    return element.textContent || '';
  } else {
    element.textContent = text;
    return undefined;
  }
}

export default {
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  closest,
  matches,
  getOffset,
  getStyle,
  setStyles,
  insertAfter,
  createElement,
  empty,
  getSiblings,
  getNextSibling,
  getPreviousSibling,
  scrollIntoView,
  getScrollPosition,
  isInViewport,
  text
};