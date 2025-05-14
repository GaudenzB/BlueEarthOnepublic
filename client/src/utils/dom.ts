/**
 * DOM Utility Functions
 * 
 * This module contains utility functions for common DOM operations.
 * These functions help standardize DOM interactions and minimize direct DOM manipulation.
 */

/**
 * Safely get an element by ID with proper type casting
 */
export function getElementById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Safely get elements by class name with proper type casting and conversion to array
 */
export function getElementsByClassName<T extends HTMLElement = HTMLElement>(className: string): T[] {
  return Array.from(document.getElementsByClassName(className)) as T[];
}

/**
 * Safely query selector with proper type casting
 */
export function querySelector<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

/**
 * Safely query selector all with proper type casting and conversion to array
 */
export function querySelectorAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll(selector)) as T[];
}

/**
 * Check if an element contains a class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Add a class to an element
 */
export function addClass(element: HTMLElement, className: string): void {
  element.classList.add(className);
}

/**
 * Remove a class from an element
 */
export function removeClass(element: HTMLElement, className: string): void {
  element.classList.remove(className);
}

/**
 * Toggle a class on an element
 */
export function toggleClass(element: HTMLElement, className: string): void {
  element.classList.toggle(className);
}

/**
 * Add multiple classes to an element
 */
export function addClasses(element: HTMLElement, classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * Remove multiple classes from an element
 */
export function removeClasses(element: HTMLElement, classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * Set data attribute on an element
 */
export function setDataAttribute(element: HTMLElement, name: string, value: string): void {
  element.setAttribute(`data-${name}`, value);
}

/**
 * Get data attribute from an element
 */
export function getDataAttribute(element: HTMLElement, name: string): string | null {
  return element.getAttribute(`data-${name}`);
}

/**
 * Create an element with attributes and optional content
 */
export function createElement<T extends HTMLElement = HTMLElement>(
  tagName: string,
  attributes: Record<string, string> = {},
  content?: string
): T {
  const element = document.createElement(tagName) as T;
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      // Handle dataset as a special case
      Object.entries(JSON.parse(value)).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue as string;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Set content if provided
  if (content) {
    element.textContent = content;
  }
  
  return element;
}

/**
 * Append multiple children to an element
 */
export function appendChildren(
  parent: HTMLElement,
  children: (HTMLElement | string)[]
): HTMLElement {
  children.forEach(child => {
    if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    } else {
      parent.appendChild(child);
    }
  });
  
  return parent;
}

/**
 * Remove all children from an element
 */
export function removeAllChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Get computed style value
 */
export function getComputedStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Set inline style
 */
export function setStyle(element: HTMLElement, property: string, value: string): void {
  element.style[property as any] = value;
}

/**
 * Set multiple inline styles
 */
export function setStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property as any] = value;
  });
}

/**
 * Check if an element is visible
 */
export function isVisible(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
}

/**
 * Detect if the device is a touch device
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get viewport dimensions
 */
export function getViewport(): { width: number; height: number } {
  return {
    width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
  };
}

/**
 * Get scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
}

/**
 * Scroll to element
 */
export function scrollToElement(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth' }
): void {
  element.scrollIntoView(options);
}

/**
 * Check if an element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const viewport = getViewport();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewport.height &&
    rect.right <= viewport.width
  );
}

/**
 * Get element's distance from top of document
 */
export function getOffsetTop(element: HTMLElement): number {
  let offsetTop = 0;
  
  do {
    if (!isNaN(element.offsetTop)) {
      offsetTop += element.offsetTop;
    }
  } while ((element = element.offsetParent as HTMLElement));
  
  return offsetTop;
}

/**
 * Get element's distance from left of document
 */
export function getOffsetLeft(element: HTMLElement): number {
  let offsetLeft = 0;
  
  do {
    if (!isNaN(element.offsetLeft)) {
      offsetLeft += element.offsetLeft;
    }
  } while ((element = element.offsetParent as HTMLElement));
  
  return offsetLeft;
}

/**
 * Get element dimensions including margin
 */
export function getElementOuterSize(element: HTMLElement): { width: number; height: number } {
  const computedStyle = window.getComputedStyle(element);
  
  const width =
    element.offsetWidth +
    parseFloat(computedStyle.marginLeft) +
    parseFloat(computedStyle.marginRight);
  
  const height =
    element.offsetHeight +
    parseFloat(computedStyle.marginTop) +
    parseFloat(computedStyle.marginBottom);
  
  return { width, height };
}

export default {
  getElementById,
  getElementsByClassName,
  querySelector,
  querySelectorAll,
  hasClass,
  addClass,
  removeClass,
  toggleClass,
  addClasses,
  removeClasses,
  setDataAttribute,
  getDataAttribute,
  createElement,
  appendChildren,
  removeAllChildren,
  getComputedStyle,
  setStyle,
  setStyles,
  isVisible,
  isTouchDevice,
  getViewport,
  getScrollPosition,
  scrollToElement,
  isInViewport,
  getOffsetTop,
  getOffsetLeft,
  getElementOuterSize,
};