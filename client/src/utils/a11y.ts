/**
 * Accessibility (a11y) utility functions
 * 
 * These utilities help create accessible components with proper ARIA attributes,
 * keyboard navigation, focus management, and screen reader support.
 */

/**
 * Common ARIA role constants
 */
export const ARIA_ROLES = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  DIALOG: 'dialog',
  GRID: 'grid',
  LINK: 'link',
  LISTBOX: 'listbox',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUITEMCHECKBOX: 'menuitemcheckbox',
  MENUITEMRADIO: 'menuitemradio',
  OPTION: 'option',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  REGION: 'region',
  SCROLLBAR: 'scrollbar',
  SEARCH: 'search',
  SEARCHBOX: 'searchbox',
  SEPARATOR: 'separator',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  SWITCH: 'switch',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEGRID: 'treegrid',
  TREEITEM: 'treeitem'
};

/**
 * Common ARIA live region announcement politeness levels
 */
export const ARIA_LIVE = {
  OFF: 'off',
  POLITE: 'polite',
  ASSERTIVE: 'assertive'
};

/**
 * Creates a unique, accessible ID for DOM elements
 * 
 * @param prefix - Prefix for the ID
 * @param uniqueId - Unique identifier (string or number)
 * @returns Formatted ID string
 */
export function createAccessibleId(prefix: string, uniqueId: string | number): string {
  return `${prefix.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${uniqueId}`;
}

/**
 * Announces a message to screen readers using ARIA live regions
 * 
 * @param message - Message to announce
 * @param politeness - ARIA live politeness setting
 */
export function announce(
  message: string, 
  politeness: 'off' | 'polite' | 'assertive' = 'polite'
): void {
  // Find existing announcer or create a new one
  let announcer = document.getElementById('a11y-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('aria-live', politeness);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('tabindex', '-1');
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }
  
  // Set politeness level if different from existing
  if (announcer.getAttribute('aria-live') !== politeness) {
    announcer.setAttribute('aria-live', politeness);
  }
  
  // Clear and set the content to trigger announcement
  announcer.textContent = '';
  
  // Use setTimeout to ensure announcement is made even if multiple rapid
  // announcements are requested
  setTimeout(() => {
    announcer!.textContent = message;
  }, 50);
}

/**
 * Adds keyboard event listeners with common accessibility patterns
 * 
 * @param element - Element to attach listeners to
 * @param callbacks - Object with callbacks for different keys
 * @returns Function to remove listeners
 */
export function addKeyboardSupport(
  element: HTMLElement,
  callbacks: {
    enter?: (event: KeyboardEvent) => void;
    space?: (event: KeyboardEvent) => void;
    escape?: (event: KeyboardEvent) => void;
    tab?: (event: KeyboardEvent) => void;
    arrowUp?: (event: KeyboardEvent) => void;
    arrowDown?: (event: KeyboardEvent) => void;
    arrowLeft?: (event: KeyboardEvent) => void;
    arrowRight?: (event: KeyboardEvent) => void;
    home?: (event: KeyboardEvent) => void;
    end?: (event: KeyboardEvent) => void;
  }
): () => void {
  if (!element) return () => {};
  
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (callbacks.enter) {
          callbacks.enter(event);
        }
        break;
      
      case ' ':
      case 'Spacebar': // Older browsers
        if (callbacks.space) {
          callbacks.space(event);
        }
        break;
      
      case 'Escape':
      case 'Esc': // Older browsers
        if (callbacks.escape) {
          callbacks.escape(event);
        }
        break;
      
      case 'Tab':
        if (callbacks.tab) {
          callbacks.tab(event);
        }
        break;
      
      case 'ArrowUp':
      case 'Up': // Older browsers
        if (callbacks.arrowUp) {
          callbacks.arrowUp(event);
        }
        break;
      
      case 'ArrowDown':
      case 'Down': // Older browsers
        if (callbacks.arrowDown) {
          callbacks.arrowDown(event);
        }
        break;
      
      case 'ArrowLeft':
      case 'Left': // Older browsers
        if (callbacks.arrowLeft) {
          callbacks.arrowLeft(event);
        }
        break;
      
      case 'ArrowRight':
      case 'Right': // Older browsers
        if (callbacks.arrowRight) {
          callbacks.arrowRight(event);
        }
        break;
      
      case 'Home':
        if (callbacks.home) {
          callbacks.home(event);
        }
        break;
      
      case 'End':
        if (callbacks.end) {
          callbacks.end(event);
        }
        break;
      
      default:
        break;
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  // Return a function to remove the listener
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Creates a focus trap within an element to keep focus within modal dialogs
 * 
 * @param element - Container element for the focus trap
 * @param options - Options for the focus trap
 * @returns Function to remove trap and restore focus
 */
export function createFocusTrap(
  element: HTMLElement,
  options: {
    initialFocus?: HTMLElement;
    returnFocus?: boolean;
    escapeDeactivates?: boolean;
    onDeactivate?: () => void;
  } = {}
): () => void {
  if (!element) return () => {};
  
  const {
    initialFocus,
    returnFocus = true,
    escapeDeactivates = true,
    onDeactivate
  } = options;
  
  // Store previously focused element
  const previousActiveElement = document.activeElement as HTMLElement;
  
  // Find all focusable elements
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  // Focus the initial element
  if (initialFocus) {
    initialFocus.focus();
  } else if (firstFocusable) {
    firstFocusable.focus();
  }
  
  // Handle tab key to trap focus
  const handleTabKey = (event: KeyboardEvent) => {
    // If shift+tab on first element, move to last element
    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } 
    // If tab on last element, move to first element
    else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };
  
  // Handle escape key
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (escapeDeactivates && event.key === 'Escape') {
      deactivateTrap();
    }
  };
  
  // Add event listeners
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      handleTabKey(event);
    } else if (event.key === 'Escape') {
      handleEscapeKey(event);
    }
  });
  
  // Function to deactivate the trap
  const deactivateTrap = () => {
    element.removeEventListener('keydown', handleTabKey);
    element.removeEventListener('keydown', handleEscapeKey);
    
    if (returnFocus && previousActiveElement && 'focus' in previousActiveElement) {
      previousActiveElement.focus();
    }
    
    if (onDeactivate) {
      onDeactivate();
    }
  };
  
  return deactivateTrap;
}

/**
 * Makes an element or component focusable and activatable by keyboard
 * 
 * @param element - Element to make activatable
 * @param onClick - Click handler to trigger on activation
 * @returns Function to remove event listeners
 */
export function makeActivatable(
  element: HTMLElement,
  onClick: (event: MouseEvent | KeyboardEvent) => void
): () => void {
  if (!element) return () => {};
  
  // Make sure the element is focusable
  if (element.getAttribute('tabindex') === null) {
    element.setAttribute('tabindex', '0');
  }
  
  // Add role if none exists
  if (element.getAttribute('role') === null) {
    element.setAttribute('role', 'button');
  }
  
  // Click handler
  const handleClick = (event: MouseEvent) => {
    onClick(event);
  };
  
  // Keyboard handler
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onClick(event);
    }
  };
  
  // Add event listeners
  element.addEventListener('click', handleClick);
  element.addEventListener('keydown', handleKeyDown);
  
  // Return a function to remove listeners
  return () => {
    element.removeEventListener('click', handleClick);
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Implements the ARIA listbox pattern for custom select components
 * 
 * @param listboxElement - Container element with role="listbox"
 * @param options - Configuration options
 */
export function setupListbox(
  listboxElement: HTMLElement,
  options: {
    onSelectionChange?: (value: string, index: number) => void;
    initialSelectedIndex?: number;
    orientation?: 'vertical' | 'horizontal';
    allowTypeAhead?: boolean;
    multiselectable?: boolean;
  } = {}
): {
  getSelectedValue: () => string;
  getSelectedIndex: () => number;
  setSelectedIndex: (index: number) => void;
  cleanup: () => void;
} {
  if (!listboxElement) {
    return {
      getSelectedValue: () => '',
      getSelectedIndex: () => -1,
      setSelectedIndex: () => {},
      cleanup: () => {}
    };
  }
  
  const {
    onSelectionChange,
    initialSelectedIndex = 0,
    orientation = 'vertical',
    allowTypeAhead = true,
    multiselectable = false
  } = options;
  
  // Set ARIA attributes
  listboxElement.setAttribute('role', 'listbox');
  listboxElement.setAttribute('tabindex', '0');
  
  if (multiselectable) {
    listboxElement.setAttribute('aria-multiselectable', 'true');
  }
  
  // Get all option elements
  const getOptions = () => Array.from(
    listboxElement.querySelectorAll('[role="option"]')
  ) as HTMLElement[];
  
  let selectedIndex = initialSelectedIndex;
  
  // Set initial selection
  const setInitialSelection = () => {
    const options = getOptions();
    
    if (options.length > 0 && selectedIndex >= 0 && selectedIndex < options.length) {
      selectOption(selectedIndex);
    }
  };
  
  // Select an option by index
  const selectOption = (index: number) => {
    const options = getOptions();
    
    if (index < 0 || index >= options.length) {
      return;
    }
    
    if (!multiselectable) {
      // Remove selection from all options
      options.forEach(option => {
        option.setAttribute('aria-selected', 'false');
        option.classList.remove('selected');
      });
    }
    
    // Select the new option
    options[index].setAttribute('aria-selected', 'true');
    options[index].classList.add('selected');
    
    // Call selection change callback
    if (onSelectionChange) {
      const value = options[index].getAttribute('data-value') || options[index].textContent || '';
      onSelectionChange(value, index);
    }
    
    selectedIndex = index;
  };
  
  // Toggle selection (for multiselect)
  const toggleOption = (index: number) => {
    if (!multiselectable) {
      selectOption(index);
      return;
    }
    
    const options = getOptions();
    
    if (index < 0 || index >= options.length) {
      return;
    }
    
    const option = options[index];
    const isSelected = option.getAttribute('aria-selected') === 'true';
    
    option.setAttribute('aria-selected', isSelected ? 'false' : 'true');
    
    if (isSelected) {
      option.classList.remove('selected');
    } else {
      option.classList.add('selected');
    }
    
    // Call selection change callback
    if (onSelectionChange) {
      const value = option.getAttribute('data-value') || option.textContent || '';
      onSelectionChange(value, index);
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    const options = getOptions();
    const optionCount = options.length;
    
    if (optionCount === 0) return;
    
    const isVertical = orientation === 'vertical';
    let newIndex = selectedIndex;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'Down':
        if (isVertical) {
          newIndex = (selectedIndex + 1) % optionCount;
          event.preventDefault();
        }
        break;
      
      case 'ArrowUp':
      case 'Up':
        if (isVertical) {
          newIndex = (selectedIndex - 1 + optionCount) % optionCount;
          event.preventDefault();
        }
        break;
      
      case 'ArrowRight':
      case 'Right':
        if (!isVertical) {
          newIndex = (selectedIndex + 1) % optionCount;
          event.preventDefault();
        }
        break;
      
      case 'ArrowLeft':
      case 'Left':
        if (!isVertical) {
          newIndex = (selectedIndex - 1 + optionCount) % optionCount;
          event.preventDefault();
        }
        break;
      
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      
      case 'End':
        newIndex = optionCount - 1;
        event.preventDefault();
        break;
      
      case ' ':
      case 'Enter':
        if (multiselectable) {
          toggleOption(selectedIndex);
        } else {
          selectOption(selectedIndex);
        }
        event.preventDefault();
        break;
      
      default:
        // Type-ahead functionality
        if (allowTypeAhead && event.key.length === 1) {
          const searchChar = event.key.toLowerCase();
          let matchIndex = -1;
          
          // First try to find an option starting after the current selection
          for (let i = selectedIndex + 1; i < optionCount; i++) {
            const text = options[i].textContent || '';
            if (text.toLowerCase().startsWith(searchChar)) {
              matchIndex = i;
              break;
            }
          }
          
          // If no match found after current selection, start from beginning
          if (matchIndex === -1) {
            for (let i = 0; i < selectedIndex; i++) {
              const text = options[i].textContent || '';
              if (text.toLowerCase().startsWith(searchChar)) {
                matchIndex = i;
                break;
              }
            }
          }
          
          if (matchIndex !== -1) {
            newIndex = matchIndex;
          }
        }
        break;
    }
    
    if (newIndex !== selectedIndex) {
      selectOption(newIndex);
      options[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  
  // Handle click on option
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const option = target.closest('[role="option"]') as HTMLElement;
    
    if (!option) return;
    
    // Find the index of the clicked option
    const options = getOptions();
    const index = options.indexOf(option);
    
    if (index !== -1) {
      if (multiselectable) {
        toggleOption(index);
      } else {
        selectOption(index);
      }
    }
  };
  
  // Add event listeners
  listboxElement.addEventListener('keydown', handleKeyDown);
  listboxElement.addEventListener('click', handleClick);
  
  // Set initial selection
  setInitialSelection();
  
  // Return public API
  return {
    getSelectedValue: () => {
      const options = getOptions();
      if (selectedIndex >= 0 && selectedIndex < options.length) {
        return options[selectedIndex].getAttribute('data-value') || 
               options[selectedIndex].textContent || '';
      }
      return '';
    },
    getSelectedIndex: () => selectedIndex,
    setSelectedIndex: (index: number) => selectOption(index),
    cleanup: () => {
      listboxElement.removeEventListener('keydown', handleKeyDown);
      listboxElement.removeEventListener('click', handleClick);
    }
  };
}

export default {
  ARIA_ROLES,
  ARIA_LIVE,
  createAccessibleId,
  announce,
  addKeyboardSupport,
  createFocusTrap,
  makeActivatable,
  setupListbox
};