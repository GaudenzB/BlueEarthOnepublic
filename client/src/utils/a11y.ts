/**
 * Accessibility (a11y) Utility Functions
 * 
 * This file contains utility functions for improving accessibility
 * across the application. They help ensure the application meets
 * WCAG standards and provides a good experience for all users.
 */

/**
 * Creates an accessible ID by joining the provided parts and ensuring the result is valid
 * 
 * @param parts - String parts to join
 * @returns A valid ID string
 */
export function createAccessibleId(...parts: (string | number | null | undefined)[]): string {
  // Filter out null/undefined values and convert to strings
  const validParts = parts
    .filter(Boolean)
    .map(part => String(part).toLowerCase());
  
  // Join parts and replace invalid characters with hyphens
  const id = validParts
    .join('-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with a single one
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  return id || 'id'; // Ensure we never return an empty string
}

/**
 * Generates ARIA attributes for a form field
 * 
 * @param id - Field ID
 * @param label - Field label
 * @param error - Error message
 * @param description - Field description
 * @returns Object containing aria-* attributes
 */
export function getFieldAriaAttributes(
  id: string,
  label?: string,
  error?: string | null,
  description?: string | null
): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  // If there's an error, associate with an error ID
  if (error) {
    attrs['aria-invalid'] = 'true';
    attrs['aria-describedby'] = `${id}-error`;
  } 
  // If there's a description, associate with a description ID
  else if (description) {
    attrs['aria-describedby'] = `${id}-description`;
  }
  
  // If there's a label, ensure it's properly associated
  if (label) {
    attrs['aria-labelledby'] = `${id}-label`;
  }
  
  return attrs;
}

/**
 * Provides accessible hide-visually CSS properties
 * These can be used to hide content visually while keeping it accessible to screen readers
 * 
 * @returns Object with CSS properties for visually hidden elements
 */
export function visuallyHidden(): React.CSSProperties {
  return {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: '1px',
    whiteSpace: 'nowrap',
    wordWrap: 'normal'
  };
}

/**
 * Creates a keyboard accessible event handler that triggers on Enter and Space
 * 
 * @param handler - Function to call when triggered
 * @returns Keyboard event handler
 */
export function createKeyboardHandler(
  handler: (event: React.KeyboardEvent) => void
): (event: React.KeyboardEvent) => void {
  return (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler(event);
    }
  };
}

/**
 * Generates a random ID with a prefix
 * Useful for creating unique IDs for ARIA attributes
 * 
 * @param prefix - Prefix for the ID
 * @returns A unique ID string
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Combines multiple ARIA attributes objects into one
 * 
 * @param objects - ARIA attribute objects to combine
 * @returns Merged ARIA attributes object
 */
export function mergeAriaAttributes(
  ...objects: Record<string, string>[]
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      // Special handling for aria-describedby since it can have multiple values
      if (key === 'aria-describedby' && result[key]) {
        result[key] = `${result[key]} ${value}`;
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Creates attributes for a live region announcement
 * 
 * @param priority - Politeness setting for screen readers
 * @returns ARIA attributes for a live region
 */
export function liveRegion(
  priority: 'off' | 'polite' | 'assertive' = 'polite'
): Record<string, string> {
  return {
    'aria-live': priority,
    'aria-atomic': 'true',
    role: priority === 'off' ? 'status' : undefined
  } as Record<string, string>;
}

/**
 * Helper to determine if reduced motion should be used
 * Respects user's system preferences
 * 
 * @returns True if reduced motion should be used
 */
export function shouldUseReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Enhances a component with appropriate ARIA attributes based on its state
 * 
 * @param expanded - Whether the component is expanded
 * @param disabled - Whether the component is disabled
 * @param selected - Whether the component is selected
 * @param pressed - Whether the component is pressed
 * @returns Object with appropriate ARIA attributes
 */
export function getStateAttributes(
  expanded?: boolean,
  disabled?: boolean,
  selected?: boolean,
  pressed?: boolean
): Record<string, string | boolean> {
  const attrs: Record<string, string | boolean> = {};
  
  if (expanded !== undefined) attrs['aria-expanded'] = expanded;
  if (disabled !== undefined) attrs['aria-disabled'] = disabled;
  if (selected !== undefined) attrs['aria-selected'] = selected;
  if (pressed !== undefined) attrs['aria-pressed'] = pressed;
  
  return attrs;
}