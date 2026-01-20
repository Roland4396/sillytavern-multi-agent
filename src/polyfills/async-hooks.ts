/**
 * AsyncLocalStorage 浏览器 Polyfill
 * 简化实现，用于替代 Node.js 的 async_hooks
 */

export class AsyncLocalStorage<T> {
  private currentStore: T | undefined = undefined;

  getStore(): T | undefined {
    return this.currentStore;
  }

  run<R>(store: T, callback: () => R): R {
    const previousStore = this.currentStore;
    this.currentStore = store;
    try {
      return callback();
    } finally {
      this.currentStore = previousStore;
    }
  }

  enterWith(store: T): void {
    this.currentStore = store;
  }

  disable(): void {
    this.currentStore = undefined;
  }
}

export default { AsyncLocalStorage };
