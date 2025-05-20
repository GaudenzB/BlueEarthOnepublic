import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createAccessibleId } from '@/utils/a11y';

/**
 * MenuItem interface for keyboard navigation
 */
export interface MenuItem {
  /**
   * Unique identifier for the item
   */
  id: string | number;
  
  /**
   * Display text for the item
   */
  label: string;
  
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  
  /**
   * Optional href for link items
   */
  href?: string;
  
  /**
   * Optional icon component
   */
  icon?: React.ReactNode;
}

/**
 * Props for KeyboardNavigableMenu component
 */
export interface KeyboardNavigableMenuProps {
  /**
   * Array of menu items
   */
  items: MenuItem[];
  
  /**
   * Callback when an item is selected
   */
  onItemSelect: (item: MenuItem) => void;
  
  /**
   * Optional currently selected item ID
   */
  selectedId?: string | number;
  
  /**
   * Optional aria-label for the menu
   */
  ariaLabel?: string;
  
  /**
   * Optional className for the menu
   */
  className?: string;
  
  /**
   * Whether to enable typeahead navigation
   */
  enableTypeahead?: boolean;
  
  /**
   * Optional render prop for custom item rendering
   */
  renderItem?: (item: MenuItem, isSelected: boolean, index: number) => React.ReactNode;
  
  /**
   * Optional ID for the menu
   */
  id?: string;
}

/**
 * KeyboardNavigableMenu Component
 * 
 * A menu component that supports robust keyboard navigation, including:
 * - Arrow keys for navigation
 * - Home/End for first/last item navigation
 * - Typeahead functionality for quick access
 * - Full ARIA attributes for screen reader support
 * 
 * @example
 * ```tsx
 * const items = [
 *   { id: 'dashboard', label: 'Dashboard' },
 *   { id: 'documents', label: 'Documents' },
 *   { id: 'settings', label: 'Settings', disabled: true }
 * ];
 * 
 * <KeyboardNavigableMenu
 *   items={items}
 *   onItemSelect={item => navigate(item.id)}
 *   selectedId="dashboard"
 *   ariaLabel="Main Navigation"
 * />
 * ```
 */
export const KeyboardNavigableMenu: React.FC<KeyboardNavigableMenuProps> = ({
  items,
  onItemSelect,
  selectedId,
  ariaLabel = 'Menu',
  className = '',
  enableTypeahead = true,
  renderItem,
  id: providedId
}) => {
  // Generate a unique ID if not provided
  const id = useRef(providedId || createAccessibleId('menu')).current;
  
  // Refs for keyboard navigation
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  
  // State for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [typeaheadBuffer, setTypeaheadBuffer] = useState<string>('');
  const [typeaheadTimeout, setTypeaheadTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Find initial focused index from selectedId
  useEffect(() => {
    if (selectedId) {
      const index = items.findIndex(item => item.id === selectedId);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [selectedId, items]);
  
  // Function to find next enabled menu item index
  const findNextEnabledIndex = useCallback((currentIndex: number, direction: 'up' | 'down'): number => {
    if (items.length === 0) return -1;
    
    let nextIndex = currentIndex;
    let count = 0;
    
    // Prevent infinite loop
    while (count < items.length) {
      nextIndex = direction === 'down' 
        ? (nextIndex + 1) % items.length 
        : (nextIndex - 1 + items.length) % items.length;
        
      const item = items[nextIndex];
      if (item && !item.disabled) {
        return nextIndex;
      }
      
      count++;
    }
    
    // If all items are disabled, return original index
    return currentIndex;
  }, [items]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const activeElement = document.activeElement;
    const isMenuFocused = menuRef.current?.contains(activeElement);
    
    // Only handle if menu or its children are focused
    if (!isMenuFocused) return;
    
    // Determine current index
    let currentIndex = focusedIndex;
    if (currentIndex === -1) {
      currentIndex = items.findIndex(item => !item.disabled);
    }
    
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Find next non-disabled item
        newIndex = findNextEnabledIndex(currentIndex, 'down');
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        // Find previous non-disabled item
        newIndex = findNextEnabledIndex(currentIndex, 'up');
        break;
        
      case 'Home':
        e.preventDefault();
        // Find first non-disabled item
        newIndex = findNextEnabledIndex(-1, 'down');
        break;
        
      case 'End':
        e.preventDefault();
        // Find last non-disabled item
        newIndex = findNextEnabledIndex(items.length - 1, 'up');
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < items.length) {
          const item = items[currentIndex];
          if (item && item.disabled !== true) {
            onItemSelect(item);
          }
        }
        break;
        
      default:
        // Handle typeahead if enabled
        if (enableTypeahead && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          // Add the key to the typeahead buffer
          const newTypeahead = typeaheadBuffer + e.key.toLowerCase();
          setTypeaheadBuffer(newTypeahead);
          
          // Clear the previous timeout
          if (typeaheadTimeout) {
            clearTimeout(typeaheadTimeout);
          }
          
          // Set a new timeout to clear the typeahead buffer after 1 second
          const timeout = setTimeout(() => {
            setTypeaheadBuffer('');
          }, 1000);
          
          setTypeaheadTimeout(timeout);
          
          // Find the first item that starts with the typeahead buffer
          const matchIndex = items.findIndex(item => 
            !item.disabled && 
            item.label.toLowerCase().startsWith(newTypeahead)
          );
          
          if (matchIndex !== -1) {
            newIndex = matchIndex;
          }
        }
        break;
    }
    
    // Update focused index if it changed
    if (newIndex !== currentIndex) {
      setFocusedIndex(newIndex);
      if (itemRefs.current[newIndex]) {
        itemRefs.current[newIndex]?.focus();
      }
    }
  }, [focusedIndex, items, onItemSelect, typeaheadBuffer, typeaheadTimeout, enableTypeahead, findNextEnabledIndex]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typeaheadTimeout) {
        clearTimeout(typeaheadTimeout);
      }
    };
  }, [typeaheadTimeout]);
  
  // Handle menu item click
  const handleItemClick = useCallback((item: MenuItem, index: number) => {
    if (!item.disabled) {
      setFocusedIndex(index);
      onItemSelect(item);
    }
  }, [onItemSelect]);
  
  // Default render for menu items
  const defaultRenderItem = (item: MenuItem, isSelected: boolean, _index: number) => (
    <div className={`px-4 py-2 text-sm flex items-center ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
      {item.icon && <span className="mr-2">{item.icon}</span>}
      {item.label}
    </div>
  );
  
  return (
    <ul
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel = undefined}
      className={`list-none p-0 m-0 border border-gray-200 rounded-md overflow-hidden ${className = undefined}`}
      onKeyDown={handleKeyDown}
      id={id}
      tabIndex={0}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          role="menuitem"
          aria-disabled={item.disabled || false}
          tabIndex={focusedIndex === index ? 0 : -1}
          onClick={() => handleItemClick(item, index)}
          ref={el => (itemRefs.current[index] = el)}
          className={`outline-none ${focusedIndex === index ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
          id={`${id}-item-${item.id}`}
        >
          {renderItem ? renderItem(item, focusedIndex === index, index) : defaultRenderItem(item, focusedIndex === index, index)}
        </li>
      ))}
    </ul>
  );
};

export default KeyboardNavigableMenu;