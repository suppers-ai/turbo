/**
 * Efficient deep cloning utility using structured cloning when available
 */

/**
 * Deep clone an object using the most efficient method available
 */
export function deepClone<T>(obj: T): T {
  // Use structured cloning if available (Node 17+ and modern browsers)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // Fall back to manual cloning if structuredClone fails
    }
  }

  // Manual deep clone for older environments
  return manualDeepClone(obj);
}

/**
 * Manual deep clone implementation
 */
function manualDeepClone<T>(obj: T, visited = new WeakMap()): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj as object)) {
    return visited.get(obj as object) as T;
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    const cloned: unknown[] = [];
    visited.set(obj, cloned as T);

    for (let i = 0; i < obj.length; i++) {
      cloned[i] = manualDeepClone(obj[i], visited);
    }

    return cloned as unknown as T;
  }

  // Handle Map
  if (obj instanceof Map) {
    const cloned = new Map();
    visited.set(obj, cloned as T);

    obj.forEach((value, key) => {
      cloned.set(
        manualDeepClone(key, visited),
        manualDeepClone(value, visited)
      );
    });

    return cloned as unknown as T;
  }

  // Handle Set
  if (obj instanceof Set) {
    const cloned = new Set();
    visited.set(obj, cloned as T);

    obj.forEach(value => {
      cloned.add(manualDeepClone(value, visited));
    });

    return cloned as unknown as T;
  }

  // Handle plain objects
  const cloned: Record<string, unknown> = {};
  visited.set(obj as object, cloned as T);

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = manualDeepClone(obj[key], visited);
    }
  }

  return cloned as T;
}

/**
 * Create a shallow clone of an object
 */
export function shallowClone<T extends Record<string, unknown>>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as unknown as T;
  }

  return { ...obj };
}