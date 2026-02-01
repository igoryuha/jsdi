import { isFunction } from "./type-guards.js";

class AsyncContainer {
  #scope;
  #graph;
  #parent;
  #cache;
  #cleanups;
  #get;

  constructor(scope, graph, parent = null) {
    this.#scope = scope;
    this.#graph = graph;
    this.#parent = parent;
    this.#cache = new Map();
    this.#cleanups = [];

    this.#get = this.get.bind(this);
  }

  async get(key) {
    const node = this.#graph.get(key);
    if (!node) {
      throw new Error(`key ${key} is not registered in the container`);
    }

    if (this.#scope !== node.scope) {
      if (this.#parent) {
        return this.#parent.get(key);
      } else {
        throw new Error("cannot resolve a dependency outside of its scope");
      }
    }

    if (this.#cache.has(key)) {
      return this.#cache.get(key);
    }

    const maybePromise = node.resolve(this.#get, this.#cleanups);

    this.#cache.set(key, maybePromise);
    const result = await maybePromise;
    this.#cache.set(key, result);

    return result;
  }

  async close() {
    for (let i = this.#cleanups.length - 1; i >= 0; i--) {
      const r = await this.#cleanups[i].next();
      if (!r.done) {
        throw new Error("cleanup generator must yield exactly once");
      }
    }
    this.#cache.clear();
  }

  async withNestedScope(scope, action) {
    const nextScope = this.#scope - 1;

    if (isFunction(scope)) {
      action = scope;
      scope = nextScope;
    }

    if (scope === this.#scope) {
      return action(this);
    }

    if (scope > this.#scope) {
      throw new Error(`cannot enter wider scope: from ${this.#scope} to ${scope}`);
    }

    const nestedContainer = new AsyncContainer(nextScope, this.#graph, this);

    try {
      return scope < nextScope
        ? await nestedContainer.withNestedScope(scope, action)
        : await action(nestedContainer);
    } finally {
      await nestedContainer.close();
    }
  }

  get scope() {
    return this.#scope;
  }
}

export { AsyncContainer };
