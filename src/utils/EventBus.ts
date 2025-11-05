/**
 * Type-safe event bus for game events
 */

type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Type-safe event emitter
 */
export class EventBus<TEvents extends Record<string, unknown>> {
  private listeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();
  private onceListeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler<unknown>);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler<unknown>);

      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }

    this.onceListeners.get(event)!.add(handler as EventHandler<unknown>);
  }

  /**
   * Emit an event
   */
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    // Handle regular listeners
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${String(event)}:`, error);
        }
      });
    }

    // Handle once listeners
    const onceHandlers = this.onceListeners.get(event);
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in once handler for ${String(event)}:`, error);
        }
      });

      this.onceListeners.delete(event);
    }
  }

  /**
   * Emit an event asynchronously
   */
  async emitAsync<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
    const handlers = this.listeners.get(event);
    const onceHandlers = this.onceListeners.get(event);

    const allHandlers = [
      ...(handlers || []),
      ...(onceHandlers || []),
    ];

    await Promise.all(
      allHandlers.map(async handler => {
        try {
          await handler(data);
        } catch (error) {
          console.error(`Error in async handler for ${String(event)}:`, error);
        }
      })
    );

    if (onceHandlers) {
      this.onceListeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: keyof TEvents): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: keyof TEvents): number {
    const regular = this.listeners.get(event)?.size || 0;
    const once = this.onceListeners.get(event)?.size || 0;
    return regular + once;
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners(event: keyof TEvents): boolean {
    return this.listenerCount(event) > 0;
  }
}