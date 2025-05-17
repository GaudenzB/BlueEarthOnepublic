import { EventEmitter } from 'events';

/**
 * Create a typed event emitter
 * 
 * @returns A typed event emitter instance
 */
export function createEventEmitter<T extends Record<string, any>>(): {
  on: <K extends keyof T>(event: K, listener: (data: T[K]) => void) => void;
  emit: <K extends keyof T>(event: K, data: T[K]) => boolean;
} {
  const emitter = new EventEmitter();
  
  return {
    on: <K extends keyof T>(event: K, listener: (data: T[K]) => void): void => {
      emitter.on(event as string, listener);
    },
    emit: <K extends keyof T>(event: K, data: T[K]): boolean => {
      return emitter.emit(event as string, data);
    }
  };
}