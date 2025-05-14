/**
 * UI Components Export
 * 
 * This file exports all UI components as a centralized entry point.
 * Components can be imported from '@/components/ui' instead of their individual files.
 */

// Custom components
export { default as StatusTag } from './StatusTag';
export type { StatusTagProps, StatusType } from './StatusTag';

export { default as EmployeeCard } from './EmployeeCard';
export type { EmployeeCardProps, Employee } from './EmployeeCard';

export { default as LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';

export { default as SkipLink } from './SkipLink';
export type { SkipLinkProps } from './SkipLink';

export { default as EmptyState } from './EmptyState';
export { default as Toast } from './Toast';
// Also export from lowercase file for compatibility
export * from './toast';
export { default as CardContainer } from './CardContainer';
export { default as PageHeader } from './PageHeader';
export { default as KeyboardNavigableMenu } from './KeyboardNavigableMenu';

// Layout components
export * from './sidebar';
export * from './spinner';

// Extended Ant Design components with custom styling
export { Button } from './button';
export { Input } from './input';
export { Textarea } from './textarea';
export { Select } from './select';
export { Checkbox } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Switch } from './switch';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';
export { Pagination } from './pagination';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Badge } from './badge';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
export { ScrollArea } from './scroll-area';
export { Separator } from './separator';