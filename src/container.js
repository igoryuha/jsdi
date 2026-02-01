import { isFunction, isPromise } from "./type-guards.js";

class Container {
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

  #cacheResult(key, value) {
    this.#cache.set(key, value);
    return value;
  }

  get(key) {
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

    return this.#cacheResult(key, node.resolve(this.#get, this.#cleanups));
  }

  close() {
    for (let i = this.#cleanups.length - 1; i >= 0; i--) {
      const r = this.#cleanups[i].next();
      if (!r.done) {
        throw new Error("cleanup generator must yield exactly once");
      }
    }
    this.#cache.clear();
  }

  withNestedScope(scope, action) {
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

    const nestedContainer = new Container(nextScope, this.#graph, this);

    let result;
    try {
      result =
        scope < nextScope
          ? nestedContainer.withNestedScope(scope, action)
          : action(nestedContainer);
    } catch (e) {
      nestedContainer.close();
      throw e;
    }

    if (isPromise(result)) {
      return result.finally(() => nestedContainer.close());
    }

    nestedContainer.close();
    return result;
  }

  get scope() {
    return this.#scope;
  }
}

export { Container };
